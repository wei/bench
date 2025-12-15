import { Octokit } from "@octokit/rest";

// Centralized GitHub client so we consistently attach auth/user agent.
export function createGithubClient() {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN || undefined,
    userAgent: "mlh-bench-app",
  });
}
