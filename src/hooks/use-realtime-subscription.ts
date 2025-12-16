import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { Tables } from "@/database.types";
import { createClient } from "@/lib/supabase/client";

type Event = Tables<"events">;
type Project = Tables<"projects">;
type PrizeCategory = Tables<"prize_categories">;

export function useRealtimeSubscription() {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountingRef = useRef(false);

  useEffect(() => {
    isUnmountingRef.current = false;
    const supabase = createClient();

    const setupSubscription = () => {
      // Clean up any existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Clear any pending reconnect
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      console.log("Setting up Supabase Realtime subscription...");

      const channel = supabase
        .channel("dashboard-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "events" },
          (payload: RealtimePostgresChangesPayload<Event>) => {
            console.log("Realtime event update:", payload);
            queryClient.setQueryData<Event[]>(["events"], (oldEvents) => {
              if (!oldEvents) return oldEvents;
              const { eventType, new: newRecord, old: oldRecord } = payload;

              if (eventType === "INSERT") return [newRecord, ...oldEvents];
              if (eventType === "UPDATE")
                return oldEvents.map((e) =>
                  e.id === newRecord.id ? newRecord : e,
                );
              if (eventType === "DELETE")
                return oldEvents.filter((e) => e.id !== oldRecord.id);
              return oldEvents;
            });
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "projects" },
          (payload: RealtimePostgresChangesPayload<Project>) => {
            console.log("Realtime project update:", payload);
            const { eventType } = payload;
            // Supabase can send partial rows on UPDATE (only changed columns),
            // so merge with the existing cached project to avoid dropping fields
            // like prize_results when the final status update arrives.
            const newRecord = payload.new as Partial<Project>;
            const oldRecord = payload.old as Partial<Project>;
            const projectId = newRecord?.id || oldRecord?.id;
            const eventId = newRecord?.event_id || oldRecord?.event_id;

            // Update all queries tracking projects
            const queries = queryClient.getQueriesData<Project[]>({
              queryKey: ["projects"],
            });

            for (const [queryKey, oldProjects] of queries) {
              if (!oldProjects) continue;

              const queryEventId = queryKey[1] as string | undefined;

              // If query is for a specific event, and this project isn't for it, ignore
              if (queryEventId && eventId && queryEventId !== eventId) continue;

              queryClient.setQueryData(queryKey, (current: Project[]) => {
                if (!current) return current;
                if (eventType === "INSERT")
                  return [newRecord as Project, ...current];
                if (eventType === "UPDATE")
                  return current.map((p) =>
                    p.id === projectId
                      ? ({ ...p, ...oldRecord, ...newRecord } as Project)
                      : p,
                  );
                if (eventType === "DELETE")
                  return current.filter((p) => p.id !== projectId);
                return current;
              });
            }
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "prize_categories" },
          (payload: RealtimePostgresChangesPayload<PrizeCategory>) => {
            console.log("Realtime prize_category update:", payload);
            queryClient.setQueryData<PrizeCategory[]>(
              ["prize_categories"],
              (oldCats) => {
                if (!oldCats) return oldCats;
                const { eventType, new: newRecord, old: oldRecord } = payload;

                if (eventType === "INSERT") return [...oldCats, newRecord];
                if (eventType === "UPDATE")
                  return oldCats.map((c) =>
                    c.id === newRecord.id ? newRecord : c,
                  );
                if (eventType === "DELETE")
                  return oldCats.filter((c) => c.id !== oldRecord.id);
                return oldCats;
              },
            );
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("Subscribed to realtime changes");
            reconnectAttemptsRef.current = 0; // Reset on successful subscription
          } else if (status === "CHANNEL_ERROR") {
            console.error("Realtime subscription error");
            toast.error("Realtime connection lost");
            attemptReconnect();
          } else if (status === "TIMED_OUT" || status === "CLOSED") {
            console.warn(
              `Realtime subscription ${status.toLowerCase()}, attempting to reconnect...`,
            );
            attemptReconnect();
          }
        });

      channelRef.current = channel;
    };

    const attemptReconnect = () => {
      if (isUnmountingRef.current) return;

      // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
      const maxDelay = 30000;
      const delay = Math.min(
        2 ** reconnectAttemptsRef.current * 1000,
        maxDelay,
      );

      reconnectAttemptsRef.current += 1;

      console.log(
        `Attempting to reconnect realtime subscription (attempt ${reconnectAttemptsRef.current}) in ${delay}ms...`,
      );

      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isUnmountingRef.current) {
          setupSubscription();
        }
      }, delay);
    };

    // Initial subscription setup
    setupSubscription();

    return () => {
      isUnmountingRef.current = true;
      console.log("Cleaning up Supabase Realtime subscription...");

      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Remove channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient]);
}
