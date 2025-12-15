// Common bot account patterns to exclude
const BOT_PATTERNS = [
  "snyk",
  "dependabot",
  "dependabot-preview",
  "claude-code",
  "v0",
  "renovate",
  "greenkeeper",
  "codecov",
  "allcontributors",
  "imgbot",
  "stale",
  "bors",
  "mergify",
  "github-actions",
];

interface GitHubUser {
  login: string;
  public_repos: number;
  type: string;
}

interface GitHubContributor {
  login: string;
  type: string;
  contributions: number;
}

/**
 * Get the number of public repositories for a GitHub username
 */
export async function getRepositoryCount(username: string): Promise<number> {
  const token = process.env.GITHUB_PAT_TOKEN;

  if (!token) {
    throw new Error("GITHUB_PAT_TOKEN is not configured");
  }

  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `token ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`User '${username}' not found`);
      }
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`,
      );
    }

    const user: GitHubUser = await response.json();
    return user.public_repos;
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `[GitHubService] Failed to get repository count for ${username}:`,
        error.message,
      );
      throw error;
    }
    throw new Error("Unknown error occurred while fetching repository count");
  }
}

/**
 * Get all contributors for a GitHub repository, excluding bot accounts
 */
export async function getRepositoryContributors(
  username: string,
  repository: string,
): Promise<string[]> {
  const token = process.env.GITHUB_PAT_TOKEN;

  if (!token) {
    throw new Error("GITHUB_PAT_TOKEN is not configured");
  }

  try {
    const contributors: string[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await fetch(
        `https://api.github.com/repos/${username}/${repository}/contributors?page=${page}&per_page=${perPage}`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `token ${token}`,
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Repository '${username}/${repository}' not found`);
        }
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}`,
        );
      }

      const data: GitHubContributor[] = await response.json();

      if (data.length === 0) {
        break;
      }

      // Filter out bots
      const humanContributors = data
        .filter((contributor) => {
          // Exclude by type
          if (contributor.type === "Bot") {
            return false;
          }

          // Exclude by common bot patterns
          const loginLower = contributor.login.toLowerCase();
          return !BOT_PATTERNS.some((pattern) =>
            loginLower.includes(pattern.toLowerCase()),
          );
        })
        .map((contributor) => contributor.login);

      contributors.push(...humanContributors);

      // If we got fewer results than perPage, we're on the last page
      if (data.length < perPage) {
        break;
      }

      page++;
    }

    // Remove duplicates (shouldn't happen, but just in case)
    return [...new Set(contributors)];
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `[GitHubService] Failed to get contributors for ${username}/${repository}:`,
        error.message,
      );
      throw error;
    }
    throw new Error("Unknown error occurred while fetching contributors");
  }
}
