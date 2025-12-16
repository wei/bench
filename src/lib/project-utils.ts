import type { Project, ProjectProcessingStatus } from "@/lib/store";

// Get team_members from csv_row
export function getTeamMembers(project: Project): Array<{
  name: string;
  github_username?: string;
  devpost_username?: string;
  github_repos_count?: number;
  devpost_projects_count?: number;
}> {
  if (
    project.csv_row &&
    typeof project.csv_row === "object" &&
    "team_members" in project.csv_row
  ) {
    const members = project.csv_row.team_members;
    if (Array.isArray(members)) {
      return members as Array<{
        name: string;
        github_username?: string;
        devpost_username?: string;
        github_repos_count?: number;
        devpost_projects_count?: number;
      }>;
    }
  }
  return [];
}

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

// Get metrics from csv_row
export function getMetrics(project: Project): {
  complexity: number;
  quality: number;
  completeness: number;
} | null {
  if (
    project.csv_row &&
    typeof project.csv_row === "object" &&
    "metrics" in project.csv_row
  ) {
    const metrics = project.csv_row.metrics;
    if (
      metrics &&
      typeof metrics === "object" &&
      "complexity" in metrics &&
      "quality" in metrics &&
      "completeness" in metrics
    ) {
      return metrics as {
        complexity: number;
        quality: number;
        completeness: number;
      };
    }
  }
  return null;
}

// Parse prize_results
export function parsePrizeResults(prizeResults: unknown): Record<
  string,
  {
    status: "valid" | "invalid";
    message: string;
  }
> | null {
  if (
    !prizeResults ||
    typeof prizeResults !== "object" ||
    Array.isArray(prizeResults)
  ) {
    return null;
  }
  return prizeResults as Record<
    string,
    { status: "valid" | "invalid"; message: string }
  >;
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
