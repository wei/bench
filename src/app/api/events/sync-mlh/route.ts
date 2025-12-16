import { NextResponse } from "next/server";
import { syncMlhEventsToDb } from "@/lib/mlh-core/sync-events";

export async function POST(request: Request) {
  try {
    // Default behavior: roll 30 days and sync physical hackathons.
    // See `fetchMlhEvents()` for defaults.
    void request;
    const result = await syncMlhEventsToDb({
      daysFromNow: 90,
      imagesOnly: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("[sync-mlh] Failed to sync events:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
