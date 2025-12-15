"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ProcessingModal() {
  const { processingProjects, projects, showProcessingModal } = useStore();
  const isOpen = showProcessingModal && processingProjects.length > 0;

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
    if (status.startsWith("invalid")) return "bg-red-500";
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

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="max-w-6xl max-h-[95vh] w-[95vw]"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Processing Projects</DialogTitle>
        </DialogHeader>

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
                <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                <span className="text-gray-600">Invalid</span>
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
      </DialogContent>
    </Dialog>
  );
}
