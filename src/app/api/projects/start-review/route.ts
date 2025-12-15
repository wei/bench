import { after, NextResponse } from "next/server";
import { startProjectReview } from "@/lib/review/project-review";
import type { ProjectWithEvent } from "@/lib/review/types";
import { createClient } from "@/lib/supabase/server";

const POSTGREST_ERROR_NO_ROWS = "PGRST116";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const projectId = body?.project_id;

    if (typeof projectId !== "string" || !projectId.trim()) {
      return NextResponse.json(
        { error: "project_id is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: project, error } = await supabase
      .from("projects")
      .select("*, event:events(starts_at, ends_at)")
      .eq("id", projectId.trim())
      .single();

    if (error || !project) {
      if (error?.code === POSTGREST_ERROR_NO_ROWS || !project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 },
        );
      }

      console.error("Failed to fetch project", error);
      return NextResponse.json(
        { error: "Failed to load project" },
        { status: 500 },
      );
    }

    after(() =>
      startProjectReview(project as ProjectWithEvent).catch((processError) => {
        console.error("Project review processing failed", processError);
      }),
    );

    return NextResponse.json({ status: "accepted" }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error starting review", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
