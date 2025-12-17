"use client";

import { ArrowRight, Calendar, FolderKanban } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useState } from "react";
import { ProjectTable } from "@/components/projects/project-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Project } from "@/lib/store";
import { useStore } from "@/lib/store";

interface ProjectsViewProps {
  readonly onRunAnalysis: (projectId: string) => void;
  readonly onBatchRun: (projectIds: string[]) => void;
  readonly onImport: () => void;
  readonly onProjectClick: (project: Project) => void;
  readonly eventId?: string | null;
}

export function ProjectsView({
  onRunAnalysis,
  onBatchRun,
  onImport,
  onProjectClick,
  eventId,
}: ProjectsViewProps) {
  const { projects, selectedEventId, events, updateEvent, favoriteProjects } =
    useStore();
  const [isJudgingView, setIsJudgingView] = React.useState(false);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [localStartTime, setLocalStartTime] = useState("");
  const [localEndTime, setLocalEndTime] = useState("");
  const [localJudgingEndTime, setLocalJudgingEndTime] = useState("");

  const activeEventId = eventId ?? selectedEventId ?? null;

  const filteredProjects = activeEventId
    ? projects.filter((p) => p.event_id === activeEventId)
    : projects;

  const activeEvent = activeEventId
    ? events.find((e) => e.id === activeEventId)
    : null;

  const projectsTitle = activeEvent?.name;
  const eventLogoUrl = activeEvent?.logo_url ?? null;

  // Format date/time for display
  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const currentYear = new Date().getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");

    // Include year if it's different from current year
    const dateStr =
      year !== currentYear ? `${month}/${day}/${year}` : `${month}/${day}`;

    return {
      date: dateStr,
      time: `${displayHours}:${displayMinutes}${ampm}`,
    };
  };

  // Format for datetime-local input (memoized for performance)
  const formatForInputMemo = React.useCallback(
    (dateString: string | null | undefined) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    },
    [],
  );

  const handleOpenDateDialog = React.useCallback(() => {
    if (activeEvent) {
      setLocalStartTime(formatForInputMemo(activeEvent.starts_at));
      setLocalEndTime(formatForInputMemo(activeEvent.ends_at));
      setLocalJudgingEndTime(
        formatForInputMemo(
          (activeEvent as { judging_ends_at?: string | null }).judging_ends_at,
        ),
      );
      setIsDateDialogOpen(true);
    }
  }, [activeEvent, formatForInputMemo]);

  const handleSaveDates = async () => {
    if (activeEvent) {
      const updates: {
        starts_at?: string | null;
        ends_at?: string | null;
        judging_ends_at?: string | null;
      } = {};
      // Always include starts_at and ends_at, even if empty (set to null)
      if (localStartTime) {
        updates.starts_at = new Date(localStartTime).toISOString();
      } else {
        updates.starts_at = null;
      }
      if (localEndTime) {
        updates.ends_at = new Date(localEndTime).toISOString();
      } else {
        updates.ends_at = null;
      }
      // Judging end time handling (already has explicit null)
      if (localJudgingEndTime) {
        updates.judging_ends_at = new Date(localJudgingEndTime).toISOString();
      } else {
        updates.judging_ends_at = null;
      }

      // Update local store
      updateEvent(activeEvent.id, updates);

      // Write to database
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { error } = await supabase
          .from("events")
          .update(updates)
          .eq("id", activeEvent.id);

        if (error) {
          console.error("Failed to save hackathon dates:", error);
          // Optionally show an error notification to the user
        }
      } catch (error) {
        console.error("Failed to save hackathon dates:", error);
      }

      setIsDateDialogOpen(false);
    }
  };

  const startDateTime = formatDateTime(activeEvent?.starts_at);
  const endDateTime = formatDateTime(activeEvent?.ends_at);

  // Calculate completion percentage
  const completionPercentage = React.useMemo(() => {
    // In judging view, calculate based on favorited projects only
    const projectsToCalculate = isJudgingView
      ? filteredProjects.filter((p) => favoriteProjects.includes(p.id))
      : filteredProjects;

    if (projectsToCalculate.length === 0) return 0;
    const scoredCount = projectsToCalculate.filter(
      (p) => p.judging_rating !== null && p.judging_rating !== undefined,
    ).length;
    return Math.round((scoredCount / projectsToCalculate.length) * 100);
  }, [filteredProjects, isJudgingView, favoriteProjects]);

  // Timer calculations with real-time updates
  const [currentTime, setCurrentTime] = useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  const timerInfo = React.useMemo(() => {
    if (!activeEvent?.starts_at || !activeEvent?.ends_at) return null;
    const now = currentTime;
    const start = new Date(activeEvent.starts_at);
    const end = new Date(activeEvent.ends_at);
    const judgingEndTime = (activeEvent as { judging_ends_at?: string | null })
      .judging_ends_at;
    const judgingEnd = judgingEndTime ? new Date(judgingEndTime) : null;

    if (now < start) {
      // Hackathon hasn't started
      return null;
    }

    if (now >= end) {
      // Hackathon has ended
      if (judgingEnd && now < judgingEnd) {
        // Show judging timer
        const diff = judgingEnd.getTime() - now.getTime();
        const total = judgingEnd.getTime() - end.getTime();
        const progress = Math.max(
          0,
          Math.min(100, ((total - diff) / total) * 100),
        );
        return {
          type: "judging" as const,
          remaining: diff,
          progress,
        };
      }
      // Show "ended" message
      return {
        type: "ended" as const,
        message: judgingEnd ? "judging ended" : "hacking ended",
      };
    }

    // Show hackathon timer
    const diff = end.getTime() - now.getTime();
    const total = end.getTime() - start.getTime();
    const progress = Math.max(0, Math.min(100, ((total - diff) / total) * 100));
    return {
      type: "hacking" as const,
      remaining: diff,
      progress,
    };
  }, [activeEvent, currentTime]);

  const formatTimeRemaining = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}hr`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getProgressTextColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-700 dark:text-green-300";
    if (percentage >= 50) return "text-yellow-700 dark:text-yellow-300";
    return "text-red-700 dark:text-red-300";
  };

  return (
    <div className="relative flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {activeEvent && (
            <div className="relative w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center">
              {eventLogoUrl ? (
                <Image
                  src={eventLogoUrl}
                  alt={`${activeEvent.name} logo`}
                  fill
                  className="object-contain p-1"
                  sizes="48px"
                  priority
                />
              ) : (
                <div />
              )}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {projectsTitle}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              {/* Hackathon Date & Time Badge */}
              {startDateTime && endDateTime && (
                <Dialog
                  open={isDateDialogOpen}
                  onOpenChange={setIsDateDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={handleOpenDateDialog}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      <span className="underline decoration-dashed decoration-1 underline-offset-2">
                        {startDateTime.date} {startDateTime.time}
                      </span>
                      <ArrowRight className="w-3 h-3 mx-1" />
                      <span className="underline decoration-dashed decoration-1 underline-offset-2">
                        {endDateTime.date} {endDateTime.time}
                      </span>
                    </Badge>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Hackathon Dates & Times</DialogTitle>
                      <DialogDescription>
                        Set the start and end times for the hackathon, and
                        optionally set a judging period end time.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-time">Hackathon Start</Label>
                        <Input
                          id="start-time"
                          type="datetime-local"
                          value={localStartTime}
                          onChange={(e) => setLocalStartTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-time">Hackathon End</Label>
                        <Input
                          id="end-time"
                          type="datetime-local"
                          value={localEndTime}
                          onChange={(e) => setLocalEndTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="judging-end-time">
                          Judging End (Optional)
                        </Label>
                        <Input
                          id="judging-end-time"
                          type="datetime-local"
                          value={localJudgingEndTime}
                          onChange={(e) =>
                            setLocalJudgingEndTime(e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveDates}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Number of Submissions Badge */}
              <Badge variant="outline">
                <FolderKanban className="w-3 h-3 mr-1" />
                {filteredProjects.length} submissions
              </Badge>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2">
          {/* Timer Badge */}
          {timerInfo && timerInfo.type !== "ended" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="relative overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-help"
                  >
                    <div
                      className="absolute inset-0 opacity-20 transition-all"
                      style={{
                        width: `${timerInfo.progress}%`,
                        backgroundColor: getProgressColor(
                          100 - timerInfo.progress,
                        ),
                      }}
                    />
                    <span
                      className={`relative z-10 font-semibold ${getProgressTextColor(
                        100 - timerInfo.progress,
                      )}`}
                    >
                      {timerInfo.type === "judging" ? "Judging: " : ""}
                      {formatTimeRemaining(timerInfo.remaining)} (
                      {Math.round(timerInfo.progress)}%)
                    </span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {timerInfo.type === "judging"
                      ? "Time remaining until judging period ends"
                      : "Time remaining until hackathon ends"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {timerInfo?.type === "ended" && (
            <Badge
              variant="outline"
              className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              {timerInfo.message}
            </Badge>
          )}

          {/* Completion Percentage Badge */}
          <Badge
            variant="outline"
            className="relative overflow-hidden bg-gray-100 dark:bg-gray-800"
          >
            <div
              className="absolute inset-0 opacity-20 transition-all"
              style={{
                width: `${completionPercentage}%`,
                backgroundColor: getProgressColor(completionPercentage),
              }}
            />
            <span
              className={`relative z-10 font-semibold ${getProgressTextColor(
                completionPercentage,
              )}`}
            >
              {completionPercentage}% scored
            </span>
          </Badge>
        </div>
      </div>

      <div className="relative">
        <ProjectTable
          projects={filteredProjects}
          onRunAnalysis={onRunAnalysis}
          onBatchRun={onBatchRun}
          onImport={onImport}
          onProjectClick={onProjectClick}
          onJudgingViewChange={setIsJudgingView}
          eventId={activeEventId}
        />
      </div>
    </div>
  );
}
