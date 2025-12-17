import type { Tables } from "@/database.types";
import { getPrizeTracks, parsePrizeResults } from "@/lib/project-utils";
import type { Project } from "@/lib/store";

type PrizeCategory = Tables<"prize_categories">;

function formatPrizeCategories(
  project: Project,
  prizeCategories: PrizeCategory[],
): string {
  const prizeResults = parsePrizeResults(project.prize_results);

  const prizeSlugs = new Set<string>([
    ...getPrizeTracks(project),
    ...(prizeResults ? Object.keys(prizeResults) : []),
  ]);

  if (prizeSlugs.size === 0) {
    return "- No prize categories associated with this project.";
  }

  return Array.from(prizeSlugs)
    .map((slug) => {
      const category = prizeCategories.find((cat) => cat.slug === slug);
      const name = category?.name ?? slug;
      const systemPrompt =
        category?.system_prompt?.trim() || "No system prompt available.";

      const indentedSystemPrompt = systemPrompt.replace(
        /^/gm,
        "  ",
      ); /* keep formatting readable */

      return [
        `<prize_category prize_name="${name}">`,
        indentedSystemPrompt,
        `</prize_category>`,
      ].join("\n");
    })
    .join("\n");
}

export function buildCopilotChatPrompt(
  project: Project,
  prizeCategories: PrizeCategory[],
): string {
  const projectName = project.project_title || "Untitled project";
  const githubUrl = project.github_url || "No GitHub URL provided.";

  return [
    `${githubUrl}`,
    "",
    "You are an expert hackathon judging agent helping a hackathon judge evaluate a project.",
    `Project name: ${projectName}`,
    "",
    "Prize category context (include these names and prompts in your reasoning):",
    formatPrizeCategories(project, prizeCategories),
    "",
    "Tasks:",
    "1) Summarize the project concisely based on the repository.",
    "2) Provide a brief code review (strengths, risks, testing/quality signals).",
    "3) Give a usage readiness rating (1-5) with a short rationale.",
    "4) Give an implementation rating (invalid/beginner/intermediate/advanced) and describe what the implementation actually covers.",
    "5) For each prize category, note alignment using its name and system prompt for guidance.",
    "",
    "When reporting information to me, be extremely direct and concise and sacrifice grammar for the sake of concision. Prefer list format.",
  ].join("\n");
}
