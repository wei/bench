import type { PrizeReviewResult } from "@/lib/review/prize-results";
import type { Project, ProjectProcessingStatus } from "@/lib/store";

// Get code_review from csv_row or technical_complexity_message
export function getCodeReview(project: Project): {
  tech_stack: string[];
  review_description: string;
  additional_notes?: string;
} | null {
  if (
    project.csv_row &&
    typeof project.csv_row === "object" &&
    "code_review" in project.csv_row
  ) {
    const review = project.csv_row.code_review;
    if (
      review &&
      typeof review === "object" &&
      "review_description" in review
    ) {
      return review as {
        tech_stack: string[];
        review_description: string;
        additional_notes?: string;
      };
    }
  }
  // fallback to technical_complexity_message if available
  if (project.technical_complexity_message) {
    return {
      tech_stack: project.tech_stack,
      review_description: project.technical_complexity_message,
    };
  }
  return null;
}

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

// Get prize_tracks from standardized_opt_in_prizes or csv_row
export function getPrizeTracks(project: Project): string[] {
  if (project.standardized_opt_in_prizes?.length > 0) {
    return project.standardized_opt_in_prizes;
  }
  if (
    project.csv_row &&
    typeof project.csv_row === "object" &&
    "prize_tracks" in project.csv_row
  ) {
    const tracks = project.csv_row.prize_tracks;
    if (Array.isArray(tracks)) {
      return tracks.filter(
        (track): track is string => typeof track === "string",
      );
    }
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

// Get complexity color
export function getComplexityColor(complexity: string | null): string {
  switch (complexity) {
    case "beginner":
      return "bg-yellow-500 text-white";
    case "intermediate":
      return "bg-blue-500 text-white";
    case "advanced":
      return "bg-red-500 text-white";
    default:
      return "bg-gray-300 text-gray-700";
  }
}
