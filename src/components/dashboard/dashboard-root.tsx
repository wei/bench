"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { CSVImportDialog } from "@/components/projects/csv-import-dialog";
import { ProjectDetailPane } from "@/components/projects/project-detail-pane";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import { useSession } from "@/hooks/use-session";
import { startProjectReview } from "@/lib/data-service";
import { sendReviewTriggeredWebhook } from "@/lib/discord";
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
    setSelectedEventId,
    setProcessingProjects,
    setShowProcessingModal,
    addNotification,
  } = useStore();
  const { user } = useSession();
  // Using next-themes for theme management instead of store
  // const { theme } = useTheme(); // Assuming we want to use it, but for now just removing the broken store reference

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  // Allow us to optimistically clear the event when navigating back to /events
  const [overrideEventId, setOverrideEventId] = useState<string | null>();

  // Enable Realtime Subscription
  // useRealtimeSubscription(); // Moving this call inside, or keeping it?
  // Wait, useRealtimeSubscription needs to be updated first or we should call it here?
  // The plan said "Update useRealtimeSubscription", but it's used here.
  // Ideally, useDashboardData handles fetching, but useRealtimeSubscription handles updates.
  // Let's keep useRealtimeSubscription call here for now, but we will modify it next.
  useRealtimeSubscription();

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

  const { isLoading } = useDashboardData(activeEventId);

  // Sync the selected event in the store with the incoming route param
  useEffect(() => {
    setSelectedEventId(routeEventId ?? null);
    // Clear any optimistic override once the route param is authoritative
    setOverrideEventId(undefined);
  }, [routeEventId, setSelectedEventId]);

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

    const eventName =
      events.find((e) => e.id === (project.event_id || activeEventId))?.name ??
      null;

    void sendReviewTriggeredWebhook({
      userEmail: user?.email,
      eventName,
      projectCount: 1,
    });

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

    const fallbackEventId =
      projects.find((p) => p.id === projectIds[0])?.event_id ?? null;
    const eventName =
      events.find((e) => e.id === activeEventId)?.name ??
      events.find((e) => e.id === fallbackEventId)?.name ??
      null;

    void sendReviewTriggeredWebhook({
      userEmail: user?.email,
      eventName,
      projectCount: projectIds.length,
    });

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

  const handleImport = (insertedCount: number) => {
    toast.success(`Imported ${insertedCount} project(s)`);
    // Assuming Realtime subscription updates the store, or we might want to force a re-fetch.
    // For now, let's assume Realtime handles it as per useRealtimeSubscription.
  };

  const selectedEvent = events.find((e) => e.id === activeEventId);
  const selectedEventName = selectedEvent?.name;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center flex flex-col items-center">
          <div className="mx-auto mb-4">
            <Image
              src="/logo.svg"
              width={48}
              height={48}
              alt="Bench Logo"
              className="w-12 h-12 animate-spin mr-2"
            />
          </div>
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
          hasExistingProjects={projects.some(
            (p) => p.event_id === activeEventId,
          )}
        />
      )}
    </DashboardContext.Provider>
  );
}
