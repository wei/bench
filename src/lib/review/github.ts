import type { Octokit } from "@octokit/rest";

import { createGithubClient } from "@/lib/github/client";
import type { GithubRepo } from "@/lib/review/types";

export function parseGithubRepo(url: string): GithubRepo | null {
  if (!url.trim()) return null;

  const normalized = url.startsWith("http") ? url : `https://${url}`;

  try {
    const parsed = new URL(normalized);

    if (!parsed.hostname.toLowerCase().includes("github.com")) {
      return null;
    }

    const [owner, repo] = parsed.pathname.replace(/^\//, "").split("/");
    if (!owner || !repo) return null;

    return { owner, repo: repo.replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

export async function isRepoAccessible(github: Octokit, repo: GithubRepo) {
  try {
    await github.repos.get({
      owner: repo.owner,
      repo: repo.repo,
    });
    return { ok: true as const };
  } catch (error) {
    const status = getGithubStatus(error);
    if (status === 404 || status === 403) {
      return {
        ok: false as const,
        message: "GitHub repository not found or is not public.",
      };
    }

    return {
      ok: false as const,
      message: `Failed to reach GitHub repository${status ? ` (status ${status})` : ""}.`,
    };
  }
}

export async function fetchCommitDates(github: Octokit, repo: GithubRepo) {
  try {
    const latestResponse = await github.request(
      "GET /repos/{owner}/{repo}/commits",
      {
        owner: repo.owner,
        repo: repo.repo,
        per_page: 1,
      },
    );

    const latestCommit = (latestResponse.data as any[])?.[0];
    const latestTimestamp =
      latestCommit?.commit?.author?.date ??
      latestCommit?.commit?.committer?.date;

    if (!latestTimestamp) {
      return {
        ok: false as const,
        message: "Unable to read latest commit timestamp.",
      };
    }

    const lastPage = extractLastPage(latestResponse.headers.link);
    let earliestTimestamp = latestTimestamp;

    if (lastPage && lastPage > 1) {
      const earliestResponse = await github.request(
        "GET /repos/{owner}/{repo}/commits",
        {
          owner: repo.owner,
          repo: repo.repo,
          per_page: 1,
          page: lastPage,
        },
      );

      const earliestCommit = (earliestResponse.data as any[])?.[0];
      earliestTimestamp =
        earliestCommit?.commit?.author?.date ??
        earliestCommit?.commit?.committer?.date ??
        earliestTimestamp;
    }

    return {
      ok: true as const,
      firstCommitAt: earliestTimestamp,
      lastCommitAt: latestTimestamp,
    };
  } catch (error) {
    console.error("Failed to fetch commit dates", error);
    return {
      ok: false as const,
      message: "Unexpected error while fetching commit dates.",
    };
  }
}

export function createGithub() {
  return createGithubClient();
}

function extractLastPage(linkHeader: string | undefined) {
  if (!linkHeader) return null;
  const match = linkHeader.match(/&page=(\d+)>; rel="last"/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function getGithubStatus(error: unknown) {
  if (typeof error === "object" && error && "status" in error) {
    return Number((error as { status?: number }).status);
  }
  return null;
}
