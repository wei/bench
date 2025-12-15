import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

import { setProjectStatus } from "@/lib/review/status";
import type { ReviewContext } from "@/lib/review/types";
import { buildPrizeCategorySystemPrompt } from "@/prompts/prize-category-review";

type PrizeReviewResult = {
  status: "valid" | "invalid";
  message: string;
};

const prizeReviewSchema = z.object({
  status: z.enum(["valid", "invalid"]),
  message: z.string(),
});

function buildUserPrompt({
  prizeSlug,
  project,
  repoContent,
}: {
  prizeSlug: string;
  project: ReviewContext["project"];
  repoContent: string;
}) {
  const { csv_row, ...projectWithoutCsv } = project;
  const csvRow = csv_row ?? {};

  return `
prize_slug: ${prizeSlug}

project_record (excluding csv_row):
${JSON.stringify(projectWithoutCsv, null, 2)}

raw_csv_row:
${JSON.stringify(csvRow, null, 2)}

repo_code_pack (full repository contents):
${repoContent || "(no code fetched)"}

Return only JSON with keys status and message. Base your decision solely on evidence found in repo_code_pack.
`.trim();
}

async function fetchPrizeCategorySystemPrompt(
  context: ReviewContext,
  prizeSlug: string,
) {
  const { data, error } = await context.supabase
    .from("prize_categories")
    .select("slug, system_prompt")
    .eq("slug", prizeSlug)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch prize category", { prizeSlug, error });
    await setProjectStatus(
      context.supabase,
      context.project.id,
      "errored",
      `Failed to fetch prize category ${prizeSlug}`,
    );
    return null;
  }

  if (!data) {
    console.warn(`Prize category not found for slug ${prizeSlug}`);
    return null;
  }

  return data.system_prompt;
}

async function markPrizeProcessing(context: ReviewContext, prizeSlug: string) {
  const existing =
    (context.project.prize_results as Record<
      string,
      PrizeReviewResult
    > | null) ?? {};

  const updatedPrizeResults = {
    ...existing,
    [prizeSlug]: {
      status: "processing",
      message: `Reviewing prize: ${prizeSlug}`,
    },
  };

  const { error } = await context.supabase
    .from("projects")
    .update({ prize_results: updatedPrizeResults })
    .eq("id", context.project.id);

  if (error) {
    console.error("Failed to set prize processing status", {
      prizeSlug,
      error,
    });
    await setProjectStatus(
      context.supabase,
      context.project.id,
      "errored",
      `Failed to set processing status for prize ${prizeSlug}`,
    );
    return false;
  }

  context.project.prize_results = updatedPrizeResults;
  return true;
}

async function persistPrizeResult(
  context: ReviewContext,
  prizeSlug: string,
  result: PrizeReviewResult,
) {
  const existing = (context.project.prize_results ?? {}) as Record<
    string,
    PrizeReviewResult
  >;

  const updatedPrizeResults = {
    ...existing,
    [prizeSlug]: result,
  };

  const { error } = await context.supabase
    .from("projects")
    .update({ prize_results: updatedPrizeResults })
    .eq("id", context.project.id);

  if (error) {
    console.error("Failed to persist prize review result", {
      prizeSlug,
      error,
    });
    await setProjectStatus(
      context.supabase,
      context.project.id,
      "errored",
      `Failed to persist prize result for ${prizeSlug}`,
    );
    return false;
  }

  // Keep context in sync for downstream agents or further prize reviews.
  context.project.prize_results = updatedPrizeResults;
  return true;
}

export async function prizeCategoryReviewAgent(
  context: ReviewContext,
  prizeSlug: string,
) {
  if (!context.repoInfo?.repoContent) {
    await setProjectStatus(
      context.supabase,
      context.project.id,
      "invalid:github_inaccessible",
      "Missing repository content for prize review.",
    );
    return { ok: false as const };
  }

  const markedProcessing = await markPrizeProcessing(context, prizeSlug);
  if (!markedProcessing) return { ok: false as const };

  // TODO: Move get prize_category out of fetchPrizeCategorySystemPrompt
  // create Grep agent method

  const systemPrompt = await fetchPrizeCategorySystemPrompt(context, prizeSlug);

  if (!systemPrompt) {
    // Record a placeholder result so the missing configuration is visible.
    const recorded = await persistPrizeResult(context, prizeSlug, {
      status: "invalid",
      message: "Prize category configuration not found.",
    });
    return { ok: recorded };
  }

  const prompt = buildUserPrompt({
    prizeSlug,
    project: context.project,
    repoContent: context.repoInfo.repoContent,
  });

  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: prizeReviewSchema,
      system: buildPrizeCategorySystemPrompt(systemPrompt),
      prompt,
    });

    const data = object;
    console.debug(`Prize review result for ${prizeSlug}:`, data);

    const recorded = await persistPrizeResult(context, prizeSlug, data);
    if (!recorded) return { ok: false as const };

    return { ok: true as const, data };
  } catch (error) {
    console.error(`Prize review agent failed for ${prizeSlug}`, error);
    await setProjectStatus(
      context.supabase,
      context.project.id,
      "errored",
      `Prize review agent failed for ${prizeSlug}`,
    );
    return { ok: false as const };
  }
}
