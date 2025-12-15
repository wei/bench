import type { Database } from "@/database.types";
import type { createClient } from "@/lib/supabase/server";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];

export type ProjectWithEvent = ProjectRow & {
  event: Pick<EventRow, "starts_at" | "ends_at"> | null;
};

export type GithubRepo = { owner: string; repo: string };

export type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
