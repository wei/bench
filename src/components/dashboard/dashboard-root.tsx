"use client";

import { useParams, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ProcessingModal } from "@/components/processing-modal";
import { CSVImportDialog } from "@/components/projects/csv-import-dialog";
import { ProjectDetailPane } from "@/components/projects/project-detail-pane";
import { getEvents, getProjects, startProjectReview } from "@/lib/data-service";
import type { Project } from "@/lib/store";
import { useStore } from "@/lib/store";

interface DashboardContextValue {
  activeEventId: string | null;
  selectedProject: Project | null;
  selectedEventName?: string;
  handleProjectClick: (project: Project) => void;
  handleRunAnalysis: (projectId: string) => Promise<void>;
  handleBatchRun: (projectIds: string[]) => Promise<void>;
  handleImportClick: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within DashboardRoot");
  }
  return ctx;
}

interface DashboardRootProps {
  readonly children: React.ReactNode;
}

// DashboardRoot now behaves like a layout wrapper around all /events routes.
export function DashboardRoot({ children }: DashboardRootProps) {
  const router = useRouter();
  const params = useParams<{
    eventId?: string | string[];
    projectId?: string | string[];
  }>();
  const {
    events,
    projects,
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
  // Allow us to optimistically clear the event when navigating back to /events
  const [overrideEventId, setOverrideEventId] = useState<string | null>();

  const routeEventId = useMemo(() => {
    if (!params?.eventId) return null;
    return Array.isArray(params.eventId) ? params.eventId[0] : params.eventId;
  }, [params]);

  const routeProjectId = useMemo(() => {
    if (!params?.projectId) return null;
    return Array.isArray(params.projectId)
      ? params.projectId[0]
      : params.projectId;
  }, [params]);

  const activeEventId = routeEventId ?? overrideEventId ?? null;

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Sync the selected event in the store with the incoming route param
  useEffect(() => {
    setSelectedEventId(routeEventId ?? null);
    // Clear any optimistic override once the route param is authoritative
    setOverrideEventId(undefined);
  }, [routeEventId, setSelectedEventId]);

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      setIsLoading(true);

      try {
        const [eventsData, projectsData] = await Promise.all([
          getEvents(),
          getProjects(routeEventId || undefined),
        ]);

        if (!isActive) return;

        setEvents(eventsData);
        setProjects(projectsData);
      } catch (error) {
        if (!isActive) return;
        console.error("Failed to load dashboard data", error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isActive = false;
    };
  }, [routeEventId, setEvents, setProjects]);

  // Preselect project from permalink
  useEffect(() => {
    if (!routeProjectId) {
      setSelectedProject(null);
      return;
    }
    const match = projects.find((p) => p.id === routeProjectId);
    if (match) {
      setSelectedProject(match);
      setSelectedEventId(match.event_id);
      // Track recently viewed
      const { addRecentlyViewedProject } = useStore.getState();
      addRecentlyViewedProject(match.id);
    }
  }, [routeProjectId, projects, setSelectedEventId]);

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

  const handleGoToEvents = () => {
    setSelectedProject(null);
    setOverrideEventId(null);
    router.push("/events");
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    const eventId = project.event_id || activeEventId;
    if (eventId) {
      router.push(`/events/${eventId}/projects/${project.id}`);
    }
    // Track recently viewed
    const { addRecentlyViewedProject } = useStore.getState();
    addRecentlyViewedProject(project.id);
  };

  const handleImportClick = () => {
    if (!activeEventId) {
      toast.error("Please select an event first");
      return;
    }
    setIsImportDialogOpen(true);
  };

  const handleImport = (newProjects: Partial<Project>[]) => {
    // Convert partial projects to full projects with required fields
    const fullProjects = newProjects.map((p) => ({
      ...p,
      event_id: p.event_id || activeEventId || "",
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

  const selectedEvent = events.find((e) => e.id === activeEventId);
  const selectedEventName = selectedEvent?.name;

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
    <DashboardContext.Provider
      value={{
        activeEventId,
        selectedProject,
        selectedEventName,
        handleProjectClick,
        handleRunAnalysis,
        handleBatchRun,
        handleImportClick,
      }}
    >
      <AppShell
        selectedEvent={selectedEvent}
        selectedProject={selectedProject}
        onProjectClick={handleProjectClick}
      >
        {children}
      </AppShell>

      <ProjectDetailPane
        project={selectedProject}
        open={!!selectedProject}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProject(null);
            if (activeEventId) {
              router.push(`/events/${activeEventId}`);
            } else {
              handleGoToEvents();
            }
          }
        }}
        onRerun={() => selectedProject && handleRunAnalysis(selectedProject.id)}
      />

      {activeEventId && (
        <CSVImportDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          onImport={handleImport}
          eventId={activeEventId}
        />
      )}

      <ProcessingModal />
    </DashboardContext.Provider>
  );
}
