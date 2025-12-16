import type { Database } from "@/database.types";
import { fetchMlhEvents, type MlhEventApi } from "@/lib/mlh-core/events";
import { createClient } from "@/lib/supabase/server";

type EventInsert = Database["public"]["Tables"]["events"]["Insert"];

type SyncResult = {
  fetched: number;
  inserted: number;
  skippedExisting: number;
  events: Database["public"]["Tables"]["events"]["Row"][];
};

function epochSecondsToIso(
  epochSeconds: number | null | undefined,
): string | null | undefined {
  if (epochSeconds === null) return null;
  if (typeof epochSeconds !== "number") return undefined;
  if (!Number.isFinite(epochSeconds)) return undefined;
  return new Date(epochSeconds * 1000).toISOString();
}

function mapMlhEventToEventInsert(event: MlhEventApi): EventInsert {
  if (!event.id) throw new Error("MLH event missing id");
  if (!event.slug) throw new Error("MLH event missing slug");
  if (!event.name) throw new Error("MLH event missing name");
  if (!event.status) throw new Error("MLH event missing status");

  const createdAt =
    typeof event.created_at === "number"
      ? new Date(event.created_at * 1000).toISOString()
      : undefined;
  const updatedAt =
    typeof event.updated_at === "number"
      ? new Date(event.updated_at * 1000).toISOString()
      : undefined;

  return {
    id: event.id,
    slug: event.slug,
    name: event.name,
    status: event.status,
    program: event.program ?? null,
    event_format: event.event_format ?? null,
    type: event.type ?? null,
    website_url: (event.website_url as string | null | undefined) ?? null,
    registration_url:
      (event.registration_url as string | null | undefined) ?? null,
    logo_url: (event.logo_url as string | null | undefined) ?? null,
    background_url: (event.background_url as string | null | undefined) ?? null,
    starts_at: epochSecondsToIso(event.starts_at) ?? null,
    ends_at: epochSecondsToIso(event.ends_at) ?? null,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

/**
 * Fetch events from MLH and insert into Supabase `events` table.
 *
 * Notes:
 * - Skips any event whose `id` already exists (no updates).
 * - Logs each event inserted (and each event skipped).
 * - Requires your Supabase policies to allow inserts/updates for the caller.
 */
export async function syncMlhEventsToDb(args?: {
  limit?: number;
  startsAtGte?: string;
  endsAtLte?: string;
  eventFormatEq?: string;
  eventTypeEq?: string;
}): Promise<SyncResult> {
  const mlhEvents = await fetchMlhEvents({
    limit: args?.limit,
    startsAtGte: args?.startsAtGte,
    endsAtLte: args?.endsAtLte,
    eventFormatEq: args?.eventFormatEq,
    eventTypeEq: args?.eventTypeEq,
  });

  const rowsById = new Map<string, EventInsert>();
  for (const event of mlhEvents) {
    if (!event.id) {
      console.warn(
        "[sync-mlh] Skipping event without id:",
        event.slug ?? "<missing-slug>",
        event.name ?? "<missing-name>",
      );
      continue;
    }

    // Log each event (safe: no secrets)
    console.log(
      `[sync-mlh] Preparing event id=${event.id} slug=${event.slug} name=${event.name}`,
    );

    if (rowsById.has(event.id)) {
      console.warn(
        `[sync-mlh] Duplicate event id in payload, keeping first: ${event.id}`,
      );
      continue;
    }
    rowsById.set(event.id, mapMlhEventToEventInsert(event));
  }

  const rows = [...rowsById.values()];
  if (rows.length === 0) {
    return { fetched: 0, inserted: 0, skippedExisting: 0, events: [] };
  }

  const supabase = await createClient();

  // Only insert events we don't already have by primary key `id`.
  const ids = rows
    .map((row) => row.id)
    .filter((id): id is string => typeof id === "string");
  const { data: existing, error: existingError } = await supabase
    .from("events")
    .select("id")
    .in("id", ids);

  if (existingError) {
    throw new Error(
      `Failed to check existing events: ${existingError.message}`,
    );
  }

  const existingIds = new Set((existing ?? []).map((r) => r.id));
  const newRows = rows.filter((row) => row.id && !existingIds.has(row.id));
  const skippedExisting = rows.length - newRows.length;

  for (const row of rows) {
    if (!row.id) continue;
    if (existingIds.has(row.id)) {
      console.log(
        `[sync-mlh] Skipping existing event id=${row.id} slug=${row.slug}`,
      );
    }
  }

  if (newRows.length === 0) {
    return {
      fetched: mlhEvents.length,
      inserted: 0,
      skippedExisting,
      events: [],
    };
  }

  const { data, error } = await supabase
    .from("events")
    .insert(newRows)
    .select("*");
  if (error) {
    throw new Error(`Failed to insert events: ${error.message}`);
  }

  return {
    fetched: mlhEvents.length,
    inserted: newRows.length,
    skippedExisting,
    events: data ?? [],
  };
}
