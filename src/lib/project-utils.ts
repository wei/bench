import type { PrizeReviewResult } from "@/lib/review/prize-results";
import type { Project, ProjectProcessingStatus } from "@/lib/store";

// Parse prize_results
export function parsePrizeResults(
  prizeResults: unknown,
): Record<string, PrizeReviewResult> | null {
  if (
    !prizeResults ||
    typeof prizeResults !== "object" ||
    Array.isArray(prizeResults)
  ) {
    return null;
  }
  return prizeResults as Record<string, PrizeReviewResult>;
}

export function getPrizeStatusDisplay(
  result: PrizeReviewResult | null | undefined,
): { status: PrizeReviewResult["status"]; message: string } {
  let status: PrizeReviewResult["status"] = "unprocessed";
  let message = "Pending review.";

  if (result?.status === "valid") {
    status = "valid";
    message = result?.message;
  } else if (result?.status === "invalid") {
    status = "invalid";
    message = result?.message;
  } else if (result?.status === "processing") {
    status = "processing";
    message = result?.message;
  } else if (result?.status === "errored") {
    status = "errored";
    message = result?.message;
  }

  return { status, message };
}

// Get prize_tracks from standardized_opt_in_prizes
export function getPrizeTracks(project: Project): string[] {
  if ((project.standardized_opt_in_prizes?.length ?? 0) > 0) {
    return project.standardized_opt_in_prizes;
  }
  return [];
}

// Get status circle color (for small indicator circles) - synced with processing modal
export function getStatusCircleColor(status: ProjectProcessingStatus): string {
  switch (status) {
    case "processed":
      return "bg-green-500";
    case "processing:code_review":
      return "bg-blue-500";
    case "processing:prize_category_review":
      return "bg-yellow-500";
    case "invalid:github_inaccessible":
    case "invalid:rule_violation":
      return "bg-orange-500";
    case "errored":
      return "bg-red-500";
    case "unprocessed":
      return "bg-gray-400";
    default:
      return "bg-gray-400";
  }
}

// Get status color for badge - synced with processing modal
export function getStatusBadgeColor(status: ProjectProcessingStatus): string {
  switch (status) {
    case "unprocessed":
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
    case "processing:code_review":
    case "processing:prize_category_review":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 animate-pulse";
    case "processed":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    case "invalid:github_inaccessible":
    case "invalid:rule_violation":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
    case "errored":
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

// Get short status label for badge
export function getStatusLabel(status: ProjectProcessingStatus): string {
  if (status.startsWith("invalid:")) {
    return "Invalid";
  }
  if (status.startsWith("processing:")) {
    return "Processing";
  }
  if (status === "errored") {
    return "Error";
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// Get detailed status message for tooltip
export function getStatusTooltipMessage(project: Project): string {
  if (project.project_processing_status_message) {
    return project.project_processing_status_message;
  }
  return "";
}

// Get complexity color (matching status badge style)
export function getComplexityColor(complexity: string | null): string {
  switch (complexity) {
    case "beginner":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    case "intermediate":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case "advanced":
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

// Get description accuracy color (matching status badge style)
export function getDescriptionAccuracyColor(accuracy: string | null): string {
  switch (accuracy) {
    case "low":
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    case "medium":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    case "high":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}
