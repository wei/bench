import {
  createGithub,
  fetchCommitDates,
  isRepoAccessible,
  parseGithubRepo,
} from "@/lib/review/github";
import {
  createSupabase,
  markProcessing,
  setProjectStatus,
} from "@/lib/review/status";
import type { ProjectWithEvent } from "@/lib/review/types";

export async function startProjectReview(project: ProjectWithEvent) {
  const supabase = await createSupabase();
  const github = createGithub();

  const processingMarked = await markProcessing(supabase, project.id);
  if (!processingMarked) return;

  console.debug(
    `Starting review for project ID ${project.id}, checking GitHub repo ${project.github_url ?? "N/A"}.`,
  );
  const repoInfo = parseGithubRepo(project.github_url ?? "");
  if (!repoInfo) {
    await setProjectStatus(
      supabase,
      project.id,
      "invalid:github_inaccessible",
      "Invalid or missing GitHub URL.",
    );
    return;
  }

  console.debug(`Fetched repo info for project ID ${project.id}:`, repoInfo);
  const repoCheck = await isRepoAccessible(github, repoInfo);
  if (!repoCheck.ok) {
    await setProjectStatus(
      supabase,
      project.id,
      "invalid:github_inaccessible",
      repoCheck.message,
    );
    return;
  }

  console.debug(
    `Repo is accessible for project ID ${project.id}, proceeding to fetch commit dates.`,
  );
  const commitDates = await fetchCommitDates(github, repoInfo);
  if (!commitDates.ok) {
    await setProjectStatus(
      supabase,
      project.id,
      "invalid:github_inaccessible",
      commitDates.message,
    );
    return;
  }

  const startsAt = project.event?.starts_at;
  const endsAt = project.event?.ends_at;

  if (startsAt && endsAt) {
    const firstCommit = new Date(commitDates.firstCommitAt);
    const lastCommit = new Date(commitDates.lastCommitAt);

    if (firstCommit < new Date(startsAt) || lastCommit > new Date(endsAt)) {
      const message = `Commits fall outside event window. First: ${commitDates.firstCommitAt}, Last: ${commitDates.lastCommitAt}, Window: ${startsAt} - ${endsAt}.`;
      await setProjectStatus(
        supabase,
        project.id,
        "invalid:rule_violation",
        message,
      );
      return;
    }
  }

  console.debug(
    `Project ID ${project.id}'s commit dates are within the hacking period.`,
  );
  await setProjectStatus(supabase, project.id, "processed", null);
}
