"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EventsPage } from "@/components/events/events-page";
import { ProcessingModal } from "@/components/processing-modal";
import { CSVImportDialog } from "@/components/projects/csv-import-dialog";
import { ProjectDetailPane } from "@/components/projects/project-detail-pane";
import { ProjectsView } from "@/components/projects/projects-view";
import { getEvents, getProjects, startProjectReview } from "@/lib/data-service";
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
    addProjects,
    setProcessingProjects,
    setShowProcessingModal,
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

  const queueProcessingProjects = (projectIds: string[]) => {
    const current = new Set(useStore.getState().processingProjects);
    projectIds.forEach((id) => {
      current.add(id);
    });
    setProcessingProjects(Array.from(current));
  };

  const dequeueProcessingProject = (projectId: string) => {
    const { processingProjects } = useStore.getState();
    if (!processingProjects.includes(projectId)) return;
    setProcessingProjects(processingProjects.filter((id) => id !== projectId));
  };

  const handleRunAnalysis = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    setShowProcessingModal(false);
    setProcessingProjects(
      useStore.getState().processingProjects.filter((id) => id !== projectId),
    );

    try {
      await startProjectReview(projectId);
      toast.success(`Started review for ${project.project_title}`);
      addNotification({
        message: `Started review for ${project.project_title}`,
        type: "info",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start review";
      dequeueProcessingProject(projectId);
      toast.error(`Could not start review: ${message}`);
      addNotification({
        message: `Failed to start review for ${project.project_title}`,
        type: "error",
      });
    }
  };

  const handleBatchRun = async (projectIds: string[]) => {
    if (projectIds.length === 0) return;

    setShowProcessingModal(true);
    queueProcessingProjects(projectIds);

    const projectNames = projectIds.map(
      (id) => projects.find((p) => p.id === id)?.project_title || "Unknown",
    );

    const startMessage =
      projectIds.length === 1
        ? `Starting review for ${projectNames[0]}`
        : `Starting review for ${projectIds.length} projects`;

    toast.info(startMessage);
    addNotification({ message: startMessage, type: "info" });

    const results = await Promise.all(
      projectIds.map(async (projectId) => {
        const projectName =
          projects.find((p) => p.id === projectId)?.project_title || "Project";
        try {
          await startProjectReview(projectId);
          return { projectId, ok: true, projectName };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to start review";
          dequeueProcessingProject(projectId);
          toast.error(`Failed to start review for ${projectName}: ${message}`);
          addNotification({
            message: `Failed to start review for ${projectName}`,
            type: "error",
          });
          return { projectId, ok: false, projectName };
        }
      }),
    );

    const successCount = results.filter((res) => res.ok).length;
    if (successCount > 0) {
      const successMessage =
        successCount === 1
          ? `Started review for ${
              results.find((res) => res.ok)?.projectName || "project"
            }`
          : `Started review for ${successCount} projects`;
      toast.success(successMessage);
      addNotification({ message: successMessage, type: "info" });
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
