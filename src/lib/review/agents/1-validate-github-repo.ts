import {
  getRepoContent,
  isRepoAccessible,
  parseGithubRepo,
} from "@/lib/review/github";
import { setProjectStatus } from "@/lib/review/status";
import type { GithubRepoInfo, ReviewAgent } from "@/lib/review/types";

export const validateGithubRepoAgent: ReviewAgent<GithubRepoInfo> = async (
  context,
) => {
  const repoInfo = parseGithubRepo(context.project.github_url ?? "");
  if (!repoInfo) {
    await setProjectStatus(
      context.supabase,
      context.project.id,
      "invalid:github_inaccessible",
      "Invalid or missing GitHub URL.",
    );
    return { ok: false };
  }

  console.debug(
    `Fetched repo info for project ID ${context.project.id}:`,
    repoInfo,
  );
  const repoCheck = await isRepoAccessible(context.github, repoInfo);
  if (!repoCheck.ok) {
    const status =
      repoCheck.message === "GitHub repository not found or is not public."
        ? "invalid:github_inaccessible"
        : "errored";

    await setProjectStatus(
      context.supabase,
      context.project.id,
      status,
      repoCheck.message,
    );
    return { ok: false };
  }

  console.debug(
    `GitHub repository is accessible for project ID ${context.project.id}.`,
  );
  const repoContent = await getRepoContent(context.github, repoInfo);
  if (!repoContent) {
    await setProjectStatus(
      context.supabase,
      context.project.id,
      "invalid:github_inaccessible",
      "Failed to fetch repository content.",
    );
    return { ok: false };
  }

  console.debug(
    `Fetched repository content for project ID ${context.project.id}.`,
  );
  repoInfo.repoContent = repoContent;

  return { ok: true, data: repoInfo };
};
