"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EventsPage } from "@/components/events/events-page";
import { ProcessingModal } from "@/components/processing-modal";
import { CSVImportDialog } from "@/components/projects/csv-import-dialog";
import { ProjectDetailPane } from "@/components/projects/project-detail-pane";
import { ProjectsView } from "@/components/projects/projects-view";
import {
  simulateCodeReview,
  simulatePrizeCategoryReview,
} from "@/lib/analysis-mock-simulator";
import { getEvents, getProjects, updateProject } from "@/lib/data-service";
import type { Project } from "@/lib/store";
import { useStore } from "@/lib/store";

export default function DashboardPage() {
  const {
    events,
    projects,
    selectedEventId,
    setEvents,
    setProjects,
    setSelectedEventId,
    updateProject: updateProjectInStore,
    addProjects,
    setProcessingProjects,
    theme,
    addNotification,
  } = useStore();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    async function loadData() {
      const [eventsData, projectsData] = await Promise.all([
        getEvents(),
        getProjects(),
      ]);

      setEvents(eventsData);
      setProjects(projectsData);
      setIsLoading(false);
    }

    loadData();
  }, [setEvents, setProjects]);

  const handleRunAnalysis = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    updateProjectInStore(projectId, { status: "processing:code_review" });

    // Step 1: Code Review
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const codeReviewResults = await simulateCodeReview(project);
    updateProjectInStore(projectId, codeReviewResults);

    // Step 2: Prize Category Review
    updateProjectInStore(projectId, {
      status: "processing:prize_category_review",
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const prizeResults = await simulatePrizeCategoryReview(project);
    updateProjectInStore(projectId, { ...prizeResults, status: "processed" });

    // Update in Supabase if available
    await updateProject(projectId, {
      ...codeReviewResults,
      ...prizeResults,
      status: "processed",
    });
  };

  const handleBatchRun = async (projectIds: string[]) => {
    setProcessingProjects(projectIds);

    const projectNames = projectIds.map(
      (id) => projects.find((p) => p.id === id)?.project_title || "Unknown",
    );

    // Show toast notification for start
    if (projectIds.length === 1) {
      toast.info(`Starting analysis for ${projectNames[0]}`);
      addNotification({
        message: `Starting analysis for ${projectNames[0]}`,
        type: "info",
      });
    } else {
      toast.info(`Starting analysis for ${projectIds.length} projects`);
      addNotification({
        message: `Starting analysis for ${projectIds.length} projects`,
        type: "info",
      });
    }

    // Process sequentially
    for (const projectId of projectIds) {
      await handleRunAnalysis(projectId);
    }

    setProcessingProjects([]);

    if (projectIds.length === 1) {
      toast.success(`Analysis complete for ${projectNames[0]}`);
      addNotification({
        message: `Analysis complete for ${projectNames[0]}`,
        type: "success",
      });
    } else {
      toast.success(`Analysis complete for ${projectIds.length} projects`);
      addNotification({
        message: `Analysis complete for ${projectIds.length} projects`,
        type: "success",
      });
    }
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    // Track recently viewed
    const { addRecentlyViewedProject } = useStore.getState();
    addRecentlyViewedProject(project.id);
  };

  const handleImportClick = () => {
    if (!selectedEventId) {
      toast.error("Please select an event first");
      return;
    }
    setIsImportDialogOpen(true);
  };

  const handleImport = (newProjects: Partial<Project>[]) => {
    // Convert partial projects to full projects with required fields
    const fullProjects = newProjects.map((p) => ({
      ...p,
      event_id: p.event_id || selectedEventId || "",
      status: p.status || "unprocessed",
      tech_stack: p.tech_stack || [],
      csv_row: p.csv_row || {},
      prize_results: p.prize_results || {},
      standardized_opt_in_prizes: p.standardized_opt_in_prizes || [],
      built_with: p.built_with || "",
      opt_in_prizes: p.opt_in_prizes || "",
      judging_shortlist: p.judging_shortlist || false,
    })) as Project[];

    addProjects(fullProjects);
    toast.success(`Imported ${fullProjects.length} project(s)`);
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e42d42] mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Bench...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppShell
        selectedEvent={selectedEvent}
        selectedProject={selectedProject}
        onProjectClick={handleProjectClick}
      >
        {!selectedEventId ? (
          <EventsPage onEventSelect={setSelectedEventId} />
        ) : (
          <ProjectsView
            onRunAnalysis={handleRunAnalysis}
            onBatchRun={handleBatchRun}
            onImport={handleImportClick}
            onProjectClick={handleProjectClick}
          />
        )}
      </AppShell>

      <ProjectDetailPane
        project={selectedProject}
        open={!!selectedProject}
        onOpenChange={(open) => !open && setSelectedProject(null)}
        onRerun={() => selectedProject && handleRunAnalysis(selectedProject.id)}
      />

      {selectedEventId && (
        <CSVImportDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          onImport={handleImport}
          eventId={selectedEventId}
        />
      )}

      <ProcessingModal />
    </>
  );
}
