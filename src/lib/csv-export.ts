import { getPrizeTracks } from "@/lib/project-utils";
import type { Project } from "@/lib/store";

/**
 * Exports filtered projects to CSV format
 * Includes all visible/filtered data from the table
 */
export function exportProjectsToCSV(projects: Project[]): void {
  if (projects.length === 0) {
    return;
  }

  // Get all unique prize track slugs from all projects
  const allPrizeTracks = new Set<string>();
  for (const project of projects) {
    const tracks = getPrizeTracks(project);
    for (const track of tracks) {
      allPrizeTracks.add(track);
    }
  }
  const prizeTrackSlugs = Array.from(allPrizeTracks).sort((a, b) =>
    a.localeCompare(b),
  );

  // Define CSV headers
  const headers = [
    "Project Title",
    "GitHub URL",
    "Submission URL",
    "Score",
    "Notes",
    "Complexity",
    "Description Accuracy",
    "Prize Tracks",
    ...prizeTrackSlugs.map((slug) => `Prize: ${slug}`),
    "Tech Stack",
    "Team Size",
    "About the Project",
    "Built With",
    "Try It Out Links",
    "Video Demo Link",
    "Submitter First Name",
    "Submitter Last Name",
    "Submitter Email",
  ];

  // Convert projects to CSV rows
  const rows = projects.map((project) => {
    const prizeTracks = getPrizeTracks(project);
    const prizeTracksStr = prizeTracks.join("; ");

    // Parse prize results for individual prize columns
    const prizeResults: Record<string, string> = {};
    if (project.prize_results && typeof project.prize_results === "object") {
      const results = project.prize_results as Record<string, unknown>;
      for (const slug of prizeTrackSlugs) {
        const result = results[slug];
        if (result && typeof result === "object" && "status" in result) {
          const status = (result as { status?: string }).status || "";
          const message = (result as { message?: string }).message || "";
          const messagePart = message ? `: ${message}` : "";
          prizeResults[slug] = `${status}${messagePart}`;
        } else {
          prizeResults[slug] = "";
        }
      }
    }

    const techStack = Array.isArray(project.tech_stack)
      ? project.tech_stack.join("; ")
      : "";

    const tryItOutLinks = Array.isArray(project.try_it_out_links)
      ? project.try_it_out_links.join("; ")
      : "";

    return [
      escapeCSV(project.project_title || ""),
      escapeCSV(project.github_url || ""),
      escapeCSV(project.submission_url || ""),
      project.judging_rating?.toString() || "",
      escapeCSV(project.judging_notes || ""),
      project.technical_complexity || "",
      project.description_accuracy_level || "",
      escapeCSV(prizeTracksStr),
      ...prizeTrackSlugs.map((slug) => escapeCSV(prizeResults[slug] || "")),
      escapeCSV(techStack),
      project.team_size?.toString() || "",
      escapeCSV(project.about_the_project || ""),
      escapeCSV(project.built_with || ""),
      escapeCSV(tryItOutLinks),
      escapeCSV(project.video_demo_link || ""),
      escapeCSV(project.submitter_first_name || ""),
      escapeCSV(project.submitter_last_name || ""),
      escapeCSV(project.submitter_email || ""),
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("download", `projects-export-${dateStr}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Escapes CSV field values
 */
function escapeCSV(value: string): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If value contains comma, newline, or double quote, wrap in quotes and escape quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes("\n") ||
    stringValue.includes('"')
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}
