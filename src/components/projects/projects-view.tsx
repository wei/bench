"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect } from "react";
import { ProjectTableNew } from "@/components/projects/project-table-new";
import type { Project } from "@/lib/store";
import { useStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

interface ProjectsViewProps {
  readonly onRunAnalysis: (projectId: string) => void;
  readonly onBatchRun: (projectIds: string[]) => void;
  readonly onImport: () => void;
  readonly onProjectClick: (project: Project) => void;
}

export function ProjectsView({
  onRunAnalysis,
  onBatchRun,
  onImport,
  onProjectClick,
}: ProjectsViewProps) {
  const {
    projects,
    selectedEventId,
    addProjects,
    setProjects,
    updateProject,
    setProcessingProjects,
  } = useStore();

  const filteredProjects = selectedEventId
    ? projects.filter((p) => p.event_id === selectedEventId)
    : projects;

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("projects-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        (payload: RealtimePostgresChangesPayload<Project>): void => {
          const newRecord = payload.new as Project | null;
          const oldRecord = payload.old as Project | null;
          const projectId = newRecord?.id || oldRecord?.id;
          if (!projectId) return;

          if (payload.eventType === "INSERT" && newRecord) {
            const exists = useStore
              .getState()
              .projects.some((project) => project.id === projectId);
            if (exists) {
              updateProject(projectId, newRecord);
            } else {
              addProjects([newRecord]);
            }
          }

          if (payload.eventType === "UPDATE" && newRecord) {
            updateProject(projectId, newRecord);
          }

          if (payload.eventType === "DELETE" && oldRecord) {
            const remaining = useStore
              .getState()
              .projects.filter((project) => project.id !== projectId);
            setProjects(remaining);
            setProcessingProjects(
              useStore
                .getState()
                .processingProjects.filter((id) => id !== projectId),
            );
          }

          const latestStatus = newRecord?.status ?? oldRecord?.status;
          const { processingProjects } = useStore.getState();

          if (latestStatus?.startsWith("processing")) {
            if (!processingProjects.includes(projectId)) {
              setProcessingProjects([...processingProjects, projectId]);
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addProjects, setProjects, updateProject, setProcessingProjects]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-600 mt-1">
            {filteredProjects.length} submissions
          </p>
        </div>
      </div>

      <ProjectTableNew
        projects={filteredProjects}
        onRunAnalysis={onRunAnalysis}
        onBatchRun={onBatchRun}
        onImport={onImport}
        onProjectClick={onProjectClick}
      />
    </div>
  );
}
