import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect } from "react";
import { toast } from "sonner";
import type { Tables } from "@/database.types";
import { useStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

type Event = Tables<"events">;
type Project = Tables<"projects">;
type PrizeCategory = Tables<"prize_categories">;

export function useRealtimeSubscription() {
  const { setEvents, setProjects, setPrizeCategories } = useStore();

  useEffect(() => {
    const supabase = createClient();
    console.log("Setting up Supabase Realtime subscription...");

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        (payload: RealtimePostgresChangesPayload<Event>) => {
          const { events } = useStore.getState();
          console.log("Realtime event update:", payload);
          if (payload.eventType === "INSERT") {
            setEvents([payload.new, ...events]);
          } else if (payload.eventType === "UPDATE") {
            setEvents(
              events.map((e) => (e.id === payload.new.id ? payload.new : e)),
            );
          } else if (payload.eventType === "DELETE") {
            setEvents(events.filter((e) => e.id !== payload.old.id));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        (payload: RealtimePostgresChangesPayload<Project>) => {
          const { projects } = useStore.getState();
          console.log("Realtime project update:", payload);
          // Note: Ideally we should check if the project belongs to the current event context
          // but for now we update the global store.
          if (payload.eventType === "INSERT") {
            setProjects([payload.new, ...projects]);
          } else if (payload.eventType === "UPDATE") {
            setProjects(
              projects.map((p) => (p.id === payload.new.id ? payload.new : p)),
            );
          } else if (payload.eventType === "DELETE") {
            setProjects(projects.filter((p) => p.id !== payload.old.id));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prize_categories" },
        (payload: RealtimePostgresChangesPayload<PrizeCategory>) => {
          const { prizeCategories } = useStore.getState();
          const { new: newRecord, old: oldRecord, eventType } = payload;
          console.log("Realtime prize_category update:", payload);

          if (eventType === "INSERT") {
            setPrizeCategories([...prizeCategories, newRecord]);
          } else if (eventType === "UPDATE") {
            setPrizeCategories(
              prizeCategories.map((c) =>
                c.id === newRecord.id ? newRecord : c,
              ),
            );
          } else if (eventType === "DELETE") {
            setPrizeCategories(
              prizeCategories.filter((c) => c.id !== oldRecord.id),
            );
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // console.log("Subscribed to realtime changes");
        } else if (status === "CHANNEL_ERROR") {
          console.error("Realtime subscription error");
          toast.error("Realtime connection lost");
        }
      });

    return () => {
      console.log("Cleaning up Supabase Realtime subscription...");
      supabase.removeChannel(channel);
    };
  }, [setEvents, setProjects, setPrizeCategories]);
}
