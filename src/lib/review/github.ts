import type { Octokit } from "@octokit/rest";

import { createGithubClient } from "@/lib/github/client";
import type { GithubRepoInfo } from "@/lib/review/types";

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

export function parseGithubRepo(url: string): GithubRepoInfo | null {
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

function shouldExclude(path: string): boolean {
  const excludePatterns = [
    "node_modules",
    ".git",
    "dist",
    "build",
    "__pycache__",
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
    "*.tar.gz",
    "*.tgz",
    "*.deb",
    "*.rpm",
  ];

  for (const pattern of excludePatterns) {
    if (pattern.startsWith("*.")) {
      if (path.toLowerCase().endsWith(pattern.slice(2).toLowerCase()))
        return true;
    } else if (path.toLowerCase().includes(pattern.toLowerCase())) return true;
  }
  return false;
}

async function collectFiles(
  github: Octokit,
  repo: GithubRepoInfo,
  path: string = "",
  files: CollectedFile[] = [],
): Promise<CollectedFile[]> {
  try {
    const response = await github.repos.getContent({
      owner: repo.owner,
      repo: repo.repo,
      path,
    });
    const contents = response.data;

    if (Array.isArray(contents)) {
      for (const item of contents) {
        if (item.type === "dir") {
          await collectFiles(github, repo, item.path, files);
        } else if (item.type === "file") {
          if (!shouldExclude(item.path)) {
            files.push({
              path: item.path,
              size: typeof item.size === "number" ? item.size : null,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(`Failed to collect files at path ${path}`, error);
  }
  return files;
}

type CollectedFile = {
  path: string;
  size: number | null;
};

async function fetchRepoFileText(
  github: Octokit,
  repo: GithubRepoInfo,
  path: string,
): Promise<string> {
  const response = await github.request(
    "GET /repos/{owner}/{repo}/contents/{path}",
    {
      owner: repo.owner,
      repo: repo.repo,
      path,
      headers: {
        accept: "application/vnd.github.raw",
      },
    },
  );

  const data: unknown = response.data;
  if (typeof data === "string") return data;

  if (
    typeof data === "object" &&
    data &&
    "content" in data &&
    "encoding" in data
  ) {
    const content = (data as { content?: unknown }).content;
    const encoding = (data as { encoding?: unknown }).encoding;
    if (typeof content === "string" && encoding === "base64") {
      return Buffer.from(content, "base64").toString("utf-8");
    }
  }

  if (Buffer.isBuffer(data)) return data.toString("utf-8");
  if (data instanceof Uint8Array) return Buffer.from(data).toString("utf-8");

  return "";
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index]);
    }
  });

  await Promise.all(workers);
  return results;
}

export async function getRepoContent(
  github: Octokit,
  repo: GithubRepoInfo,
): Promise<string> {
  const files = await collectFiles(github, repo);
  let result = "";

  console.debug(
    `Collected ${files.length} files from repository ${repo.owner}/${repo.repo}.`,
  );

  const MAX_FILE_BYTES = 200_000;
  const MAX_CONCURRENCY = 4;

  const selectedFiles = files.filter((file) => {
    if (!file.path) return false;
    if (shouldExclude(file.path)) return false;
    if (file.size != null && file.size > MAX_FILE_BYTES) return false;
    return true;
  });

  const contents = await mapLimit(
    selectedFiles,
    MAX_CONCURRENCY,
    async (file) => {
      try {
        const content = await fetchRepoFileText(github, repo, file.path);
        return { path: file.path, content };
      } catch (error) {
        console.error(`Failed to fetch content for ${file.path}`, error);
        return { path: file.path, content: "" };
      }
    },
  );

  for (const file of contents) {
    if (file.content) {
      result += `## File: \`${file.path}\`
${file.content}

`;
    }
  }

  return result;
}
