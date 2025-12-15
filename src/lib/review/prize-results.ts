import { setProjectStatus } from "@/lib/review/status";
import type { ReviewContext } from "@/lib/review/types";

export type PrizeReviewResult = {
  status: "valid" | "invalid" | "processing";
  message: string;
};

export async function markPrizeProcessing(
  context: ReviewContext,
  prizeSlug: string,
) {
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
