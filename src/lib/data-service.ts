import type { Tables } from "@/database.types";
import { createClient } from "@/lib/supabase/client";

// Type aliases for cleaner code
type Event = Tables<"events">;
type Project = Tables<"projects">;
type PrizeCategory = Tables<"prize_categories">;

export async function getEvents(): Promise<Event[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("starts_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("[DataService] Failed to fetch events:", error);
    throw error;
  }
}

export async function getProjects(eventId?: string): Promise<Project[]> {
  const supabase = createClient();

  try {
    let query = supabase.from("projects").select("*");

    if (eventId) {
      query = query.eq("event_id", eventId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("[DataService] Failed to fetch projects:", error);
    throw error;
  }
}

export async function getPrizeCategories(): Promise<PrizeCategory[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("prize_categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("[DataService] Failed to fetch prize categories:", error);
    return [];
  }
}

export async function startProjectReview(projectId: string) {
  const response = await fetch("/api/projects/start-review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      (errorBody && (errorBody.error as string)) ||
      "Failed to start project review";
    throw new Error(message);
  }

  return response.json();
}
