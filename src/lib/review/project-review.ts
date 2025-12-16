import { validateGithubRepoAgent } from "@/lib/review/agents/1-validate-github-repo";
import { hackingTimelineAgent } from "@/lib/review/agents/2-hacking-timeline";
import { codeReviewAgent } from "@/lib/review/agents/3-code-review";
import { prizeCategoryReviewAgent } from "@/lib/review/agents/4-prize-category-review";
import { createGithub } from "@/lib/review/github";
import {
  createSupabase,
  markProcessing,
  setProjectStatus,
} from "@/lib/review/status";
import type { ProjectWithEvent, ReviewContext } from "@/lib/review/types";

export async function startProjectReview(project: ProjectWithEvent) {
  const supabase = await createSupabase();
  const github = createGithub();

  const { ok: processingMarked, prizeResults } = await markProcessing(
    supabase,
    project.id,
  );
  if (!processingMarked) return;

  console.debug(
    `Starting review for project ID ${project.id}, checking GitHub repo ${
      project.github_url ?? "N/A"
    }.`,
  );
  const context: ReviewContext = { supabase, github, project };

  // Keep in-memory context in sync after reset.
  context.project.code_to_description_similarity_score = null;
  context.project.code_to_description_similarity_description = null;
  context.project.technical_complexity = null;
  context.project.technical_complexity_message = null;
  context.project.tech_stack = [];
  context.project.prize_results = prizeResults;

  const { ok: validateGitHubRepoOk, data: repoInfo } =
    await validateGithubRepoAgent(context);
  if (!validateGitHubRepoOk) {
    return;
  }

  // Add repoInfo to context for downstream agents, this includes repoContent fetched from repom
  context.repoInfo = repoInfo;

  const { ok: hackingTimelineOk } = await hackingTimelineAgent(context);
  if (!hackingTimelineOk) {
    return;
  }

  const { ok: codeReviewOk } = await codeReviewAgent(context);
  if (!codeReviewOk) {
    return;
  }

  await setProjectStatus(
    supabase,
    context.project.id,
    "processing:prize_category_review",
    null,
  );

  // Prize Category Agent Review sequencially
  for (const prizeSlug of project.standardized_opt_in_prizes || []) {
    console.debug(`Starting prize category review for prize ${prizeSlug}.`);
    await setProjectStatus(
      supabase,
      context.project.id,
      "processing:prize_category_review",
      `Processing prize: ${prizeSlug}`,
    );

    await prizeCategoryReviewAgent(context, prizeSlug);
  }

  console.debug(
    `All review agents for Project ID ${project.id} has completed.`,
  );
  await setProjectStatus(supabase, project.id, "processed", null);
}
