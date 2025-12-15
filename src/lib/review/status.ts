import type { Database } from "@/database.types";
import type { SupabaseClient } from "@/lib/review/types";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export async function markProcessing(
  supabase: SupabaseClient,
  projectId: string,
) {
  const startedAt = new Date().toISOString();
  const { error } = await supabase
    .from("projects")
    .update({
      status: "processing:code_review",
      process_started_at: startedAt,
      project_processing_status_message: null,
    })
    .eq("id", projectId);

  if (error) {
    console.error("Failed to mark project as processing", error);
    return false;
  }

  return true;
}

export async function setProjectStatus(
  supabase: SupabaseClient,
  projectId: string,
  status: Database["public"]["Enums"]["project_processing_status"],
  message: string | null,
) {
  const { error } = await supabase
    .from("projects")
    .update({
      status,
      project_processing_status_message: message,
    })
    .eq("id", projectId);

  if (error) {
    console.error("Failed to update project status", {
      projectId,
      status,
      error,
    });
    return false;
  }

  return true;
}

export async function createSupabase() {
  return createSupabaseClient();
}
