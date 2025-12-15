"use client";

import { ProjectTableNew } from "@/components/projects/project-table-new";
import type { Project } from "@/lib/store";
import { useStore } from "@/lib/store";

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
  const { projects, selectedEventId } = useStore();

  const filteredProjects = selectedEventId
    ? projects.filter((p) => p.event_id === selectedEventId)
    : projects;

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
