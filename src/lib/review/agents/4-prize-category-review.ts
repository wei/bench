import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";
import type { Database } from "@/database.types";
// import { google } from "@ai-sdk/google";
// import { getDoAI, getDoAIModelName } from "@/lib/ai/doai";
import { grepAny } from "@/lib/review/grep-tools";
import {
  markPrizeProcessing,
  persistPrizeResultsBatch,
} from "@/lib/review/prize-results";
import { setProjectStatus } from "@/lib/review/status";
import type { ReviewContext } from "@/lib/review/types";

const prizeReviewSchema = z.object({
  status: z.enum(["valid", "invalid"]),
  message: z.string(),
});

async function persistPrizeError(
  context: ReviewContext,
  prizeSlug: string,
  message: string,
) {
  const recorded = await persistPrizeResultsBatch(context, {
    [prizeSlug]: {
      status: "errored",
      message,
    },
  });
  if (!recorded) {
    console.error(`Failed to persist errored state for prize ${prizeSlug}`);
  }
  return recorded;
}

type PrizeCategoryRow = Pick<
  Database["public"]["Tables"]["prize_categories"]["Row"],
  "slug" | "name" | "system_prompt" | "find_words"
>;

function buildUserPrompt({
  prizeSlugs,
  project,
  repoContent,
}: {
  prizeSlugs: string[];
  project: ReviewContext["project"];
  repoContent: string;
}) {
  const { csv_row, ...projectWithoutCsv } = project;
  const csvRow = csv_row ?? {};

  return `
prize_slugs_to_review: ${prizeSlugs.join(", ")}

project_record (excluding csv_row):
${JSON.stringify(projectWithoutCsv, null, 2)}

raw_csv_row:
${JSON.stringify(csvRow, null, 2)}

repo_code_pack (full repository contents):
${repoContent || "(no code fetched)"}

Return only JSON with keys for each prize slug: status and message. Base your decision solely on evidence found in repo_code_pack.
`.trim();
}

function buildBatchPrizeSystemPrompt(prizeCategories: PrizeCategoryRow[]) {
  const guidance = prizeCategories
    .map(({ slug, name, system_prompt }) =>
      `
- Prize: ${name} (slug: \`${slug}\`)
${system_prompt ?? "(no guidance provided)"}
`.trim(),
    )
    .join("\n\n");

  return `
You are the Prize Category Review Agent. Determine if the repository code clearly uses the required technology for each listed prize. Ignore marketing claims and focus on evidence in the codebase.

Prize guidance by slug:
${guidance}

Rules:
- Evaluate each prize independently using the provided guidance.
- Judge using repository code only. The project description is not reliable for confirming technology usage.
- If the code shows the required technology in use, respond with status "valid" and briefly explain the evidence.
- If the code does NOT show the required technology, respond with status "invalid" and explain what is missing or contradictory in the code.
- Do not invent files or behaviors that are not present in repo_code_pack.
- Each message must be concise and exactly 3 sentences.

Output a single JSON object with keys for each prize slug. Each value must be an object with keys: status, message.
`.trim();
}

function buildPrizeBatchSchema(prizeCategories: PrizeCategoryRow[]) {
  const shape = prizeCategories.reduce<
    Record<string, typeof prizeReviewSchema>
  >((acc, category) => {
    acc[category.slug] = prizeReviewSchema;
    return acc;
  }, {});

  return z.object(shape);
}

export async function prizeCategoryReviewAgent(
  context: ReviewContext,
  prizeSlugs: string[],
  options?: {
    skipKeywordGrep?: boolean;
  },
) {
  const repoContent = context.repoInfo?.repoContent;

  if (!repoContent) {
    await Promise.all(
      prizeSlugs.map((slug) =>
        persistPrizeError(
          context,
          slug,
          "Missing repository content for prize review.",
        ),
      ),
    );
    return { ok: false as const };
  }

  if (prizeSlugs.length === 0) {
    console.debug("No prize slugs provided for review.");
    return { ok: true as const, data: {} };
  }

  const markedProcessing = await markPrizeProcessing(context, prizeSlugs);
  if (!markedProcessing) return { ok: false as const };

  const { data: prizeCategories, error } = await context.supabase
    .from("prize_categories")
    .select("slug, name, system_prompt, find_words")
    .in("slug", prizeSlugs);

  if (error) {
    console.error("Failed to fetch prize categories", { prizeSlugs, error });
    const message = `Failed to fetch prize categories: ${
      error.message ?? "unknown error"
    }`;
    await Promise.all(
      prizeSlugs.map((slug) => persistPrizeError(context, slug, message)),
    );
    return { ok: false as const };
  }

  const categoryBySlug = (prizeCategories ?? []).reduce<
    Record<string, PrizeCategoryRow>
  >((acc, category) => {
    acc[category.slug] = category;
    return acc;
  }, {});

  const eligiblePrizes: PrizeCategoryRow[] = [];

  for (const prizeSlug of prizeSlugs) {
    const prizeCategory = categoryBySlug[prizeSlug];

    if (!prizeCategory) {
      const recorded = await persistPrizeResultsBatch(context, {
        [prizeSlug]: {
          status: "invalid",
          message: "Prize category configuration not found.",
        },
      });
      if (!recorded) return { ok: false as const };
      continue;
    }

    // Keyword grep: if find_words are configured and none match the repo, skip the AI review.
    if (!options?.skipKeywordGrep) {
      const findWords = prizeCategory.find_words ?? [];

      console.debug(
        `Prize grep check for ${prizeSlug}: ${findWords.join(", ") || "(none)"}`,
      );

      if (findWords.length > 0) {
        const hasMatchedWords = grepAny(repoContent, findWords);

        if (!hasMatchedWords) {
          const message = `Keyword check failed for ${prizeCategory.name}`;

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

          const recorded = await persistPrizeResultsBatch(context, {
            [prizeSlug]: {
              status: "invalid",
              message,
            },
          });
          if (!recorded) return { ok: false as const };
          continue;
        }
      }
    } else {
      console.debug(
        `Prize grep check skipped for ${prizeSlug} (skipKeywordGrep=true)`,
      );
    }

    if (!prizeCategory.system_prompt) {
      const recorded = await persistPrizeResultsBatch(context, {
        [prizeSlug]: {
          status: "invalid",
          message: "Prize category configuration not found.",
        },
      });
      if (!recorded) return { ok: false as const };
      continue;
    }

    eligiblePrizes.push(prizeCategory);
  }

  if (eligiblePrizes.length === 0) {
    console.debug(
      "No eligible prizes required AI review after keyword checks.",
    );
    return { ok: true as const, data: {} };
  }

  const prompt = buildUserPrompt({
    prizeSlugs: eligiblePrizes.map((p) => p.slug),
    project: context.project,
    repoContent,
  });

  const systemPrompt = buildBatchPrizeSystemPrompt(eligiblePrizes);

  const schema = buildPrizeBatchSchema(eligiblePrizes);

  try {
    // const doai = getDoAI();
    const { object } = await generateObject({
      // model: google("gemini-2.5-flash"),
      // model: doai.chat(getDoAIModelName()),
      model: openrouter("google/gemini-2.5-flash"),
      schema,
      system: systemPrompt,
      prompt,
    });

    const data = object as Record<
      string,
      z.infer<typeof prizeReviewSchema> | undefined
    >;

    const updates: Record<string, z.infer<typeof prizeReviewSchema>> = {};

    for (const prize of eligiblePrizes) {
      const prizeResult = data[prize.slug];

      if (!prizeResult) {
        await persistPrizeError(
          context,
          prize.slug,
          `Missing prize result for ${prize.slug} in AI response.`,
        );
        return { ok: false as const };
      }

      console.debug(`Prize review result for ${prize.slug}:`, prizeResult);

      updates[prize.slug] = prizeResult;
    }

    const recorded = await persistPrizeResultsBatch(context, updates);
    if (!recorded) return { ok: false as const };

    return { ok: true as const, data: updates };
  } catch (error) {
    console.error("Prize review agent failed", error);
    const message = `Prize review agent failed: ${
      error instanceof Error ? error.message : String(error)
    }`;

    await Promise.all(
      eligiblePrizes.map((prize) =>
        persistPrizeError(context, prize.slug, message),
      ),
    );
    return { ok: false as const };
  }
}
