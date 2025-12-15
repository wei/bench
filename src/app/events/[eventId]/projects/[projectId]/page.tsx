"use client";

import { useDashboard } from "@/components/dashboard/dashboard-root";
import { ProjectsView } from "@/components/projects/projects-view";

export default function ProjectPage() {
  const {
    activeEventId,
    handleRunAnalysis,
    handleBatchRun,
    handleImportClick,
    handleProjectClick,
  } = useDashboard();

  return (
    <ProjectsView
      onRunAnalysis={handleRunAnalysis}
      onBatchRun={handleBatchRun}
      onImport={handleImportClick}
      onProjectClick={handleProjectClick}
      eventId={activeEventId}
    />
  );
}
