import type { Octokit } from "@octokit/rest";
import type { Database } from "@/database.types";
import type { createClient } from "@/lib/supabase/server";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];

export type ProjectWithEvent = ProjectRow & {
  event: Pick<EventRow, "starts_at" | "ends_at"> | null;
};

export type GithubRepoInfo = {
  owner: string;
  repo: string;
  repoContent?: string;
};

export type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ReviewContext = {
  supabase: SupabaseClient;
  github: Octokit;
  project: ProjectWithEvent;
  repoInfo?: GithubRepoInfo;
};

export type AgentResult<T> =
  | { ok: true; data?: T }
  | { ok: false; data?: undefined };

export type ReviewAgent<T> = (
  context: ReviewContext,
) => Promise<AgentResult<T>>;
