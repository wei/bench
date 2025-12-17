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

function formatDateYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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
    city: event.address?.city ?? null,
    state: event.address?.state ?? null,
    country: event.address?.country ?? null,
    website_url: (event.website_url as string | null | undefined) ?? null,
    registration_url:
      (event.registration_url as string | null | undefined) ?? null,
    logo_url: (event.logo_url as string | null | undefined) ?? null,
    background_url: (event.background_url as string | null | undefined) ?? null,
    event_staff_emails:
      (event.event_staff_emails as string | null | undefined) ?? null,
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
  /** Rolling window size from start date (default: 30). When provided with startsAtGte, calculates end date. Otherwise uses today as start. */
  daysFromNow?: number;
  /** When true, only process events that have a logo_url or background_url. Default: false. */
  imagesOnly?: boolean;
  /** When true, include events with 'canceled' or 'draft' status. Default: false. */
  includeCanceledAndDraft?: boolean;
}): Promise<SyncResult> {
  const daysFromNowRaw = args?.daysFromNow;
  const daysFromNow =
    typeof daysFromNowRaw === "number" && Number.isFinite(daysFromNowRaw)
      ? Math.max(0, Math.floor(daysFromNowRaw))
      : undefined;

  let startsAtGte: string | undefined;
  let endsAtLte: string | undefined;

  if (daysFromNow !== undefined) {
    // Use provided startsAtGte or default to today
    const startDate = args?.startsAtGte
      ? new Date(args.startsAtGte)
      : new Date();
    startsAtGte = formatDateYYYYMMDD(startDate);

    // Calculate end date from start date + daysFromNow
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + daysFromNow);
    endsAtLte = formatDateYYYYMMDD(endDate);
  } else {
    // Use explicit date range parameters
    startsAtGte = args?.startsAtGte;
    endsAtLte = args?.endsAtLte;
  }

  const mlhEventsRaw = await fetchMlhEvents({
    limit: args?.limit,
    startsAtGte,
    endsAtLte,
    eventFormatEq: args?.eventFormatEq,
    eventTypeEq: args?.eventTypeEq,
  });

  const imagesOnly = args?.imagesOnly ?? false;
  const includeCanceledAndDraft = args?.includeCanceledAndDraft ?? false;

  let mlhEvents = mlhEventsRaw;

  // Filter by images if requested
  if (imagesOnly) {
    mlhEvents = mlhEvents.filter((event) => {
      const logo = event.logo_url;
      const hasLogo = typeof logo === "string" && logo.length > 0;
      return hasLogo;
    });
  }

  // Filter out cancelled and draft events if requested
  if (!includeCanceledAndDraft) {
    mlhEvents = mlhEvents.filter((event) => {
      const status = event.status;
      return status !== "canceled" && status !== "draft";
    });
  }

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
    return {
      fetched: mlhEventsRaw.length,
      inserted: 0,
      skippedExisting: 0,
      events: [],
    };
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
      fetched: mlhEventsRaw.length,
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
    fetched: mlhEventsRaw.length,
    inserted: newRows.length,
    skippedExisting,
    events: data ?? [],
  };
}
