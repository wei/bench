import { generateObject } from "ai";
import { z } from "zod";
import { getDoAI, getDoAIModelName } from "@/lib/ai/doai";
import { grepAny } from "@/lib/review/grep-tools";
import {
  markPrizeProcessing,
  persistPrizeResult,
} from "@/lib/review/prize-results";
import { setProjectStatus } from "@/lib/review/status";
import type { ReviewContext } from "@/lib/review/types";
import { buildPrizeCategorySystemPrompt } from "@/prompts/prize-category-review";

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
  prizeCategory: {
    slug: string;
    system_prompt: string | null;
  } | null,
  prizeSlug: string,
) {
  if (!prizeCategory) {
    console.warn(`Prize category not found for slug ${prizeSlug}`);
    return null;
  }

  return prizeCategory.system_prompt;
}

export async function prizeCategoryReviewAgent(
  context: ReviewContext,
  prizeSlug: string,
  options?: {
    skipKeywordGrep?: boolean;
  },
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

  const { data: prizeCategory, error } = await context.supabase
    .from("prize_categories")
    .select("slug, system_prompt, find_words")
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
    return { ok: false as const };
  }

  const markedProcessing = await markPrizeProcessing(context, prizeSlug);
  if (!markedProcessing) return { ok: false as const };

  // Keyword grep: if find_words are configured and none match the repo, skip the AI review.
  if (!options?.skipKeywordGrep) {
    const repoContent = context.repoInfo.repoContent;
    const findWords = prizeCategory?.find_words ?? [];

    console.debug(`Prize grep check for ${prizeSlug}`, {
      configuredWords: findWords.length,
    });

    if (findWords.length > 0) {
      const hasMatchedWords = grepAny(repoContent, findWords);

      if (!hasMatchedWords) {
        const message = `Keyword check failed for ${prizeSlug}`;

        console.debug(`Skipping AI prize review for ${prizeSlug}:`, {
          status: "invalid",
          message: `${message}`,
        });

        await setProjectStatus(
          context.supabase,
          context.project.id,
          "processing:prize_category_review",
          `Skipping prize ${prizeSlug}: ${message}`,
        );

        const recorded = await persistPrizeResult(context, prizeSlug, {
          status: "invalid",
          message,
        });
        return { ok: recorded };
      }
    }
  } else {
    console.debug(
      `Prize grep check skipped for ${prizeSlug} (skipKeywordGrep=true)`,
    );
  }

  const systemPrompt = await fetchPrizeCategorySystemPrompt(
    prizeCategory,
    prizeSlug,
  );

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
    const doai = getDoAI();
    const { object } = await generateObject({
      model: doai.chat(getDoAIModelName()),
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
