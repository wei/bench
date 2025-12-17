import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Check if user wants to see all events (regardless of email filter)
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get("showAll") === "true";

    let query = supabase.from("events").select("*");

    // Filter events where user's email is in event_staff_emails (case-insensitive) unless showAll is true
    if (!showAll) {
      query = query.ilike("event_staff_emails", `%${session.user.email}%`);
    }

    const { data: events, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching events:", error);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 },
      );
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
