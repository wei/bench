"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type SyncResponse = {
  fetched: number;
  inserted: number;
  skippedExisting: number;
};

export function ImportEventsButton() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/events/sync-mlh", {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | SyncResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        const message =
          (payload && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : null) ?? `Request failed (${response.status})`;
        throw new Error(message);
      }

      return payload as SyncResponse;
    },
    onSuccess: async (data) => {
      toast.success(
        `Imported ${data.inserted} event(s) (skipped ${data.skippedExisting})`,
      );
      await queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to import");
    },
  });

  return (
    <Button
      variant="outline"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
    >
      <RefreshCw className={mutation.isPending ? "animate-spin" : ""} />
      {mutation.isPending ? "Importing…" : "Import Events"}
    </Button>
  );
}
