import { setProjectStatus } from "@/lib/review/status";
import type { ReviewContext } from "@/lib/review/types";

export type PrizeReviewResult = {
  status: "valid" | "invalid" | "processing" | "errored" | "unprocessed";
  message: string;
};

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
  prizeSlug: string,
) {
  return persistPrizeResult(context, prizeSlug, {
    status: "processing",
    message: `Reviewing prize: ${prizeSlug}`,
  });
}

export async function persistPrizeResult(
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
