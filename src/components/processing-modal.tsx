"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ProcessingModal() {
  const {
    processingProjects,
    projects,
    showProcessingModal,
    setShowProcessingModal,
  } = useStore();
  const isOpen = showProcessingModal && processingProjects.length > 0;

  // Auto-close modal when all projects are done processing
  useEffect(() => {
    if (!showProcessingModal || processingProjects.length === 0) return;

    // Check if all projects are done (not actively processing)
    const allDone = processingProjects.every((projectId) => {
      const project = projects.find((p) => p.id === projectId);
      const status = project?.status || "unprocessed";
      // Done if status is processed, invalid, or errored (not actively processing)
      return (
        status === "processed" ||
        status.startsWith("invalid") ||
        status === "errored"
      );
    });

    if (allDone) {
      // Small delay to show final state before closing
      const timer = setTimeout(() => {
        setShowProcessingModal(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [
    processingProjects,
    projects,
    showProcessingModal,
    setShowProcessingModal,
  ]);

  if (!isOpen) return null;

  const getProjectStatus = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.status || "unprocessed";
  };

  const getStatusColor = (status: string, projectId: string) => {
    // Check if project is queued but hasn't started processing
    const isQueued =
      processingProjects.includes(projectId) && status === "unprocessed";

    if (status === "processed") return "bg-green-500";
    if (status === "processing:code_review") return "bg-blue-500";
    if (status === "processing:prize_category_review") return "bg-yellow-500";
    if (status.startsWith("invalid")) return "bg-orange-500";
    if (status === "errored") return "bg-red-500";
    if (isQueued) return "bg-gray-400";
    return "bg-gray-400";
  };

  const circles = processingProjects.map((projectId) => {
    return {
      id: projectId,
      projectId,
    };
  });

  const getStatusDescription = (status: string) => {
    if (status === "processed") return "Analysis complete";
    if (status === "processing:code_review")
      return "Analyzing code structure and complexity";
    if (status === "processing:prize_category_review")
      return "Evaluating prize category eligibility";
    if (status.startsWith("invalid")) return "Processing failed";
    return "Queued for processing";
  };

  const handleClose = () => {
    setShowProcessingModal(false);
  };

  return (
    <div className="relative w-full max-w-6xl max-h-[95vh] bg-white dark:bg-[#262626] rounded-lg border border-gray-200 dark:border-[#404040] shadow-xl p-6 overflow-y-auto">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Processing Projects
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-8 w-8 shrink-0"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-6">
        <div className="space-y-6 py-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Analyzing {processingProjects.length}{" "}
              {processingProjects.length === 1 ? "project" : "projects"}
            </p>
          </div>

          {/* Colorful circles visualization */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center p-6 bg-gray-50 rounded-lg">
              {circles.map((circle) => {
                const status = getProjectStatus(circle.projectId);
                return (
                  <div
                    key={circle.id}
                    className={cn(
                      "w-6 h-6 rounded-full transition-all duration-300",
                      getStatusColor(status, circle.projectId),
                      status.startsWith("processing") && "animate-pulse",
                    )}
                    title={
                      projects.find((p) => p.id === circle.projectId)
                        ?.project_title || "Unknown"
                    }
                  />
                );
              })}
            </div>

            {/* Status indicators */}
            <div className="flex items-center justify-center gap-8 text-sm flex-wrap">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <div className="w-3 h-3 rounded-full bg-gray-400 shrink-0" />
                <span className="text-gray-600">Queued</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                <span className="text-gray-600">Code Review</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <div className="w-3 h-3 rounded-full bg-yellow-500 shrink-0" />
                <span className="text-gray-600">Prize Analysis</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                <span className="text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
                <span className="text-gray-600">Invalid</span>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                <span className="text-gray-600">Error</span>
              </div>
            </div>
          </div>

          {/* Compact project list with status descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {processingProjects.map((projectId) => {
              const project = projects.find((p) => p.id === projectId);
              const status = getProjectStatus(projectId);
              const description = getStatusDescription(status);

              return (
                <div
                  key={projectId}
                  className="flex items-start gap-3 p-3 bg-white border rounded-lg"
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0 mt-1.5",
                      getStatusColor(status, projectId),
                      status.startsWith("processing") && "animate-pulse",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {project?.project_title || "Unknown Project"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
