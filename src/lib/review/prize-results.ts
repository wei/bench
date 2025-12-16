import { setProjectStatus } from "@/lib/review/status";
import type { ReviewContext } from "@/lib/review/types";

export type PrizeReviewResult = {
  status: "valid" | "invalid" | "processing" | "errored" | "unprocessed";
  message: string;
};

export async function persistPrizeResultsBatch(
  context: ReviewContext,
  updates: Record<string, PrizeReviewResult>,
) {
  const existing = (context.project.prize_results ?? {}) as Record<
    string,
    PrizeReviewResult
  >;

  const updatedPrizeResults = {
    ...existing,
    ...updates,
  };

  const { error } = await context.supabase
    .from("projects")
    .update({ prize_results: updatedPrizeResults })
    .eq("id", context.project.id);

  if (error) {
    console.error("Failed to persist prize review results batch", {
      updates,
      error,
    });
    await setProjectStatus(
      context.supabase,
      context.project.id,
      "errored",
      `Failed to persist prize results batch`,
    );
    return false;
  }

  context.project.prize_results = updatedPrizeResults;
  return true;
}

export function createPendingPrizeResults(prizeSlugs: string[]) {
  return prizeSlugs.reduce<Record<string, PrizeReviewResult>>(
    (acc, prizeSlug) => {
      acc[prizeSlug] = { status: "unprocessed", message: "Pending review." };
      return acc;
    },
    {},
  );
}

export async function markPrizeProcessing(
  context: ReviewContext,
  prizeSlugs: string[],
) {
  if (prizeSlugs.length === 0) return true;

  const updates = prizeSlugs.reduce<Record<string, PrizeReviewResult>>(
    (acc, prizeSlug) => {
      acc[prizeSlug] = {
        status: "processing",
        message: `Reviewing prize: ${prizeSlug}`,
      };
      return acc;
    },
    {},
  );

  return persistPrizeResultsBatch(context, updates);
}
