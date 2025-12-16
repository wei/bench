import type { Database } from "@/database.types";
import {
  createPendingPrizeResults,
  type PrizeReviewResult,
} from "@/lib/review/prize-results";
import type { SupabaseClient } from "@/lib/review/types";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export async function markProcessing(
  supabase: SupabaseClient,
  projectId: string,
): Promise<{ ok: boolean; prizeResults: Record<string, PrizeReviewResult> }> {
  const { data: projectRow, error: fetchError } = await supabase
    .from("projects")
    .select("standardized_opt_in_prizes, prize_results")
    .eq("id", projectId)
    .maybeSingle();

  if (fetchError || !projectRow) {
    console.error("Failed to load project for processing", {
      projectId,
      error: fetchError,
    });
    return { ok: false, prizeResults: {} };
  }

  const prizeSlugs = projectRow.standardized_opt_in_prizes ?? [];
  const pendingPrizeResults = createPendingPrizeResults(prizeSlugs);

  const startedAt = new Date().toISOString();
  const { error } = await supabase
    .from("projects")
    .update({
      status: "processing:code_review",
      process_started_at: startedAt,
      project_processing_status_message: null,
      description_accuracy_level: null,
      description_accuracy_message: null,
      technical_complexity: null,
      technical_complexity_message: null,
      tech_stack: [],
      prize_results: pendingPrizeResults,
    })
    .eq("id", projectId);

  if (error) {
    console.error("Failed to mark project as processing", error);
    return { ok: false, prizeResults: {} };
  }

  return { ok: true, prizeResults: pendingPrizeResults };
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

export async function resetAgentAugmentedFields(
  supabase: SupabaseClient,
  projectId: string,
) {
  const { error } = await supabase
    .from("projects")
    .update({
      description_accuracy_level: null,
      description_accuracy_message: null,
      technical_complexity: null,
      technical_complexity_message: null,
      tech_stack: [],
      prize_results: {},
    })
    .eq("id", projectId);

  if (error) {
    console.error("Failed to reset agent-augmented fields", error);
    return false;
  }

  return true;
}
