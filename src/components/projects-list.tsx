"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import type { Database } from "@/database.types";
import { createClient } from "@/lib/supabase/client";

type Project = Database["public"]["Tables"]["projects"]["Row"];

export function ProjectsList({ eventId }: { eventId?: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Initial fetch
    const fetchProjects = async () => {
      try {
        let query = supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (eventId) {
          query = query.eq("event_id", eventId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setProjects(data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch projects",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();

    // Set up real-time subscription
    const channel = supabase
      .channel("projects-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          ...(eventId && { filter: `event_id=eq.${eventId}` }),
        },
        (payload: RealtimePostgresChangesPayload<Project>) => {
          if (payload.eventType === "INSERT") {
            setProjects((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setProjects((prev) =>
              prev.map((project) =>
                project.id === payload.new.id ? payload.new : project,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setProjects((prev) =>
              prev.filter((project) => project.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-zinc-600 dark:text-zinc-400">
          Loading projects...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950">
        <p className="text-red-800 dark:text-red-200">Error: {error}</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 p-8 text-center dark:border-zinc-800">
        <p className="text-zinc-600 dark:text-zinc-400">No projects yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Projects ({projects.length})
        </h2>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span>Live updates</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="space-y-2">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-2">
                {project.project_title || "Untitled Project"}
              </h3>

              {project.about_the_project && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
                  {project.about_the_project}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    project.status === "processed"
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : project.status?.startsWith("processing")
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        : project.status?.startsWith("invalid")
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {project.status}
                </span>

                {project.technical_complexity && (
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    {project.technical_complexity}
                  </span>
                )}
              </div>

              {project.tech_stack && project.tech_stack.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {project.tech_stack.slice(0, 3).map((tech, idx) => (
                    <span
                      key={tech}
                      className="text-xs text-zinc-500 dark:text-zinc-500"
                    >
                      {tech}
                      {idx < Math.min(project.tech_stack.length - 1, 2) && ","}
                    </span>
                  ))}
                  {project.tech_stack.length > 3 && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-500">
                      +{project.tech_stack.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {(project.github_url || project.submission_url) && (
                <div className="flex gap-2 pt-2">
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                      GitHub
                    </a>
                  )}
                  {project.submission_url && (
                    <a
                      href={project.submission_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Submission
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
