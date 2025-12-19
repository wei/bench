export interface GithubRepo {
  owner: string;
  repo: string;
}

/**
 * Parses a GitHub URL into owner and repo.
 * Handles standard https://github.com/owner/repo URLs.
 * Removes .git suffix.
 */
export function parseGithubRepo(url: string): GithubRepo | null {
  if (!url || !url.trim()) return null;

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

/**
 * Extracts and standardizes GitHub URLs from a string.
 * The input string can be a single URL, a comma-separated list, or a newline-separated list.
 * Returns an array of unique, standardized GitHub URLs (https://github.com/owner/repo).
 */
export function getGithubUrls(input: string | null | undefined): string[] {
  if (!input?.trim()) return [];

  // Split by common delimiters (newline, comma, semicolon)
  const candidates = input
    .split(/[\n,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const urls = new Set<string>();

  for (const candidate of candidates) {
    if (!candidate.toLowerCase().includes("github.com")) continue;

    const repo = parseGithubRepo(candidate);
    if (repo) {
      urls.add(`https://github.com/${repo.owner}/${repo.repo}`);
    }
  }

  return Array.from(urls);
}
