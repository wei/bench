import type { Octokit } from "@octokit/rest";

import { createGithubClient } from "@/lib/github/client";
import type { GithubRepoInfo } from "@/lib/review/types";

const COMMON_EXCLUDE_PATTERNS = [
  "node_modules/",
  ".git",
  "venv/",
  ".venv/",
  "vendor/",
  ".next/",
  ".vercel/",
  ".idea/",
  ".vscode/",
  "out/",
  "dist/",
  "build/",
  "target/",
  "coverage/",
  "__pycache__/",
  ".cache",
  ".DS_Store",
  ".env",
  "*.log",
  "*.tmp",
  "*.swp",
  "*.bak",
  "*.exe",
  "*.dll",
  "*.so",
  "*.dylib",
  "*.jar",
  "*.war",
  "*.zip",
  "*.tar",
  "*.tar.gz",
  "*.tgz",
  "*.deb",
  "*.rpm",
];

type Commit = {
  commit: {
    author?: {
      date?: string;
    };
    committer?: {
      date?: string;
    };
  };
};

import { parseGithubRepo as parseGithubRepoUtil } from "@/lib/github/utils";

export function parseGithubRepo(url: string): GithubRepoInfo | null {
  return parseGithubRepoUtil(url);
}

export async function isRepoAccessible(github: Octokit, repo: GithubRepoInfo) {
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

export async function fetchCommitDates(github: Octokit, repo: GithubRepoInfo) {
  try {
    const latestResponse = await github.request(
      "GET /repos/{owner}/{repo}/commits",
      {
        owner: repo.owner,
        repo: repo.repo,
        per_page: 1,
      },
    );

    const latestCommit = (latestResponse.data as Commit[])?.[0];
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

      const earliestCommit = (earliestResponse.data as Commit[])?.[0];
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

export async function getRepoContent(
  _github: Octokit,
  repo: GithubRepoInfo,
): Promise<string> {
  try {
    const response = await fetch("https://gitingest.com/api/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        input_text: `https://github.com/${repo.owner}/${repo.repo}`,
        token: "",
        max_file_size: "50",
        pattern_type: "exclude",
        pattern: COMMON_EXCLUDE_PATTERNS.join("\n"),
      }),
    });

    if (!response.ok) {
      console.error(
        `Failed to ingest repository ${repo.owner}/${repo.repo}. Status: ${response.status}`,
      );
      return "";
    }

    const data = (await response.json()) as {
      repo_url: string;
      tree: string;
      content: string;
    };

    console.debug(
      `Fetched repository content via gitingest for ${repo.owner}/${repo.repo}. ${data.tree}`,
    );
    return `# GitHub Repo: ${data.repo_url}\n\n## ${data.tree}\n${data.content}`;
  } catch (error) {
    console.error("Failed to fetch repository content via gitingest", error);
  }

  return "";
}
