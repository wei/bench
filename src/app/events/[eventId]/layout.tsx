"use client";

import type { ReactNode } from "react";
import { useDashboard } from "@/components/dashboard/dashboard-root";
import { ProjectsView } from "@/components/projects/projects-view";

interface EventLayoutProps {
  readonly children: ReactNode;
}

export default function EventLayout({ children }: EventLayoutProps) {
  const {
    activeEventId,
    handleRunAnalysis,
    handleBatchRun,
    handleImportClick,
    handleProjectClick,
  } = useDashboard();

  return (
    <>
      <ProjectsView
        onRunAnalysis={handleRunAnalysis}
        onBatchRun={handleBatchRun}
        onImport={handleImportClick}
        onProjectClick={handleProjectClick}
        eventId={activeEventId}
      />
      {children}
    </>
  );
}
