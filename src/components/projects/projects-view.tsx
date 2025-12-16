"use client";

import { ProcessingModal } from "@/components/processing-modal";
import { ProjectTable } from "@/components/projects/project-table";
import type { Project } from "@/lib/store";
import { useStore } from "@/lib/store";

interface ProjectsViewProps {
  readonly onRunAnalysis: (projectId: string) => void;
  readonly onBatchRun: (projectIds: string[]) => void;
  readonly onImport: () => void;
  readonly onProjectClick: (project: Project) => void;
  readonly eventId?: string | null;
}

export function ProjectsView({
  onRunAnalysis,
  onBatchRun,
  onImport,
  onProjectClick,
  eventId,
}: ProjectsViewProps) {
  const { projects, selectedEventId } = useStore();

  const activeEventId = eventId ?? selectedEventId ?? null;

  const filteredProjects = activeEventId
    ? projects.filter((p) => p.event_id === activeEventId)
    : projects;

  const { showProcessingModal } = useStore();

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-600 mt-1">
            {filteredProjects.length} submissions
          </p>
        </div>
      </div>

      <div className="relative">
        {/* Overlay background when processing */}
        {showProcessingModal && (
          <div className="absolute inset-0 bg-blue-50/20 dark:bg-blue-950/50 backdrop-blur-xs z-40 rounded-md" />
        )}

        <div
          className={
            showProcessingModal
              ? "opacity-50 pointer-events-none transition-opacity"
              : ""
          }
        >
          <ProjectTable
            projects={filteredProjects}
            onRunAnalysis={onRunAnalysis}
            onBatchRun={onBatchRun}
            onImport={onImport}
            onProjectClick={onProjectClick}
          />
        </div>

        {showProcessingModal && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-6xl mx-16">
              <ProcessingModal />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
