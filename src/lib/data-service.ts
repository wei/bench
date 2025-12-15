import type { Tables } from "@/database.types";
import { createClient } from "@/lib/supabase/client";

// Type aliases for cleaner code
type Event = Tables<"events">;
type Project = Tables<"projects">;

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

export async function updateProject(
  id: string,
  updates: Partial<Project>,
): Promise<Project | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[DataService] Failed to update project:", error);
    throw error;
  }
}
