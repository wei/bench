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
  const { processingProjects, projects } = useStore();
  const isOpen = processingProjects.length > 0;

  const getProjectStatus = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.status || "unprocessed";
  };

  const getStatusColor = (status: string) => {
    if (status === "processed") return "bg-green-500";
    if (status === "processing:code_review") return "bg-blue-500";
    if (status === "processing:prize_category_review") return "bg-yellow-500";
    if (status.startsWith("invalid")) return "bg-red-500";
    return "bg-gray-400";
  };

  const circles = processingProjects.flatMap((projectId, _index) => {
    const status = getProjectStatus(projectId);
    return Array.from({ length: 10 }, (_, i) => ({
      id: `${projectId}-${i}`,
      color: getStatusColor(status),
      projectId,
    }));
  });

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-2xl">
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
              {circles.map((circle) => (
                <div
                  key={circle.id}
                  className={cn(
                    "w-6 h-6 rounded-full transition-all duration-300",
                    circle.color,
                    getProjectStatus(circle.projectId).startsWith(
                      "processing",
                    ) && "animate-pulse",
                  )}
                />
              ))}
            </div>

            {/* Status indicators */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-gray-600">Code Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-gray-600">Prize Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-600">Completed</span>
              </div>
            </div>
          </div>

          {/* Project list */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {processingProjects.map((projectId) => {
              const project = projects.find((p) => p.id === projectId);
              const status = getProjectStatus(projectId);

              return (
                <div
                  key={projectId}
                  className="flex items-center justify-between p-3 bg-white border rounded-lg"
                >
                  <span className="text-sm font-medium">
                    {project?.project_title || "Unknown Project"}
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        getStatusColor(status),
                      )}
                    />
                    <span className="text-xs text-gray-500">
                      {status === "processing:code_review" &&
                        "Reviewing code..."}
                      {status === "processing:prize_category_review" &&
                        "Analyzing prizes..."}
                      {status === "processed" && "Complete"}
                    </span>
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
