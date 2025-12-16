"use client";

import Image from "next/image";
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
  const { projects, selectedEventId, events } = useStore();

  const activeEventId = eventId ?? selectedEventId ?? null;

  const filteredProjects = activeEventId
    ? projects.filter((p) => p.event_id === activeEventId)
    : projects;

  const activeEvent = activeEventId
    ? events.find((e) => e.id === activeEventId)
    : null;

  const { showProcessingModal } = useStore();

  const projectsTitle = activeEvent?.name;
  const eventLogoUrl = activeEvent?.logo_url ?? null;

  return (
    <div className="relative flex flex-col gap-6">
      <div className="flex items-center gap-3">
        {activeEvent && (
          <div className="relative w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center">
            {eventLogoUrl ? (
              <Image
                src={eventLogoUrl}
                alt={`${activeEvent.name} logo`}
                fill
                className="object-contain p-1"
                sizes="48px"
                priority
              />
            ) : (
              <div />
            )}
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{projectsTitle}</h2>
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
