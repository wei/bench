import { validateGithubRepoAgent } from "@/lib/review/agents/1-validate-github-repo";
import { hackingTimelineAgent } from "@/lib/review/agents/2-hacking-timeline";
import { codeReviewAgent } from "@/lib/review/agents/3-code-review";
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

  const processingMarked = await markProcessing(supabase, project.id);
  if (!processingMarked) return;

  console.debug(
    `Starting review for project ID ${project.id}, checking GitHub repo ${project.github_url ?? "N/A"}.`,
  );
  const context: ReviewContext = { supabase, github, project };

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

  console.debug(`Project ID ${project.id} passed all review agents.`);
  await setProjectStatus(supabase, project.id, "processed", null);
}
