"use client";

import {
  CheckCircle2,
  Code2,
  Gavel,
  HelpCircle,
  Info,
  LayoutTemplate,
  Loader2,
  Play,
  Star,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { DevpostIcon } from "@/components/icons/devpost-icon";
import { GithubCopilotIcon } from "@/components/icons/github-copilot-icon";
import { GithubIcon } from "@/components/icons/github-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePrizeCategories } from "@/hooks/use-prize-categories";
import {
  getPrizeStatusDisplay,
  getPrizeTracks,
  parsePrizeResults,
} from "@/lib/project-utils";
import { type Project, useStore } from "@/lib/store";
import { buildCopilotChatPrompt } from "@/prompts/copilot-chat";

// Shared debounce timers ref (module-level)
const debounceTimersRef = new Map<
  string,
  { timer: NodeJS.Timeout; type: "rating" | "notes" }
>();

// Component for judging score cell with debounced save
function JudgingScoreInput({ project }: { readonly project: Project }) {
  const { updateProject } = useStore();
  const [localValue, setLocalValue] = React.useState(
    String(project.judging_rating ?? ""),
  );

  React.useEffect(() => {
    setLocalValue(String(project.judging_rating ?? ""));
  }, [project.judging_rating]);

  const updateProjectRef = React.useRef(updateProject);
  React.useEffect(() => {
    updateProjectRef.current = updateProject;
  });

  // Cleanup timer on unmount
  React.useEffect(() => {
    const timerKey = `${project.id}:detail:rating`;
    return () => {
      const existing = debounceTimersRef.get(timerKey);
      if (existing?.type === "rating") {
        clearTimeout(existing.timer);
        debounceTimersRef.delete(timerKey);
      }
    };
  }, [project.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setLocalValue(inputValue);

    // Clear existing timer using unique key
    const timerKey = `${project.id}:detail:rating`;
    const existing = debounceTimersRef.get(timerKey);
    if (existing?.type === "rating") {
      clearTimeout(existing.timer);
    }

    // Calculate the numeric value
    const numValue =
      inputValue === ""
        ? null
        : Math.max(
            0,
            Math.min(10, Math.floor(Number.parseFloat(inputValue) || 0)),
          );

    // Set debounced save to database (and update store)
    const timer = setTimeout(async () => {
      try {
        // Update store
        updateProjectRef.current(project.id, { judging_rating: numValue });

        // Save to database
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase
          .from("projects")
          .update({ judging_rating: numValue })
          .eq("id", project.id);
      } catch (error) {
        console.error("Failed to save judging rating:", error);
      }
      debounceTimersRef.delete(timerKey);
    }, 2000);

    debounceTimersRef.set(timerKey, { timer, type: "rating" });
  };

  return (
    <Input
      type="number"
      value={localValue}
      onChange={handleChange}
      className="h-9 w-24 text-sm"
      placeholder="Score"
      min={0}
      max={10}
      step={1}
    />
  );
}

// Component for notes cell with debounced save
function NotesInput({ project }: { readonly project: Project }) {
  const { updateProject } = useStore();
  const [localValue, setLocalValue] = React.useState(
    project.judging_notes ?? "",
  );

  React.useEffect(() => {
    setLocalValue(project.judging_notes ?? "");
  }, [project.judging_notes]);

  const updateProjectRef = React.useRef(updateProject);
  React.useEffect(() => {
    updateProjectRef.current = updateProject;
  });

  // Cleanup timer on unmount
  React.useEffect(() => {
    const timerKey = `${project.id}:detail:notes`;
    return () => {
      const existing = debounceTimersRef.get(timerKey);
      if (existing?.type === "notes") {
        clearTimeout(existing.timer);
        debounceTimersRef.delete(timerKey);
      }
    };
  }, [project.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Clear existing timer using unique key
    const timerKey = `${project.id}:detail:notes`;
    const existing = debounceTimersRef.get(timerKey);
    if (existing?.type === "notes") {
      clearTimeout(existing.timer);
    }

    // Set debounced save to database (and update store)
    const timer = setTimeout(async () => {
      try {
        // Update store
        updateProjectRef.current(project.id, { judging_notes: newValue });

        // Save to database
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase
          .from("projects")
          .update({ judging_notes: newValue })
          .eq("id", project.id);
      } catch (error) {
        console.error("Failed to save judging notes:", error);
      }
      debounceTimersRef.delete(timerKey);
    }, 2000);

    debounceTimersRef.set(timerKey, { timer, type: "notes" });
  };

  return (
    <Input
      value={localValue}
      onChange={handleChange}
      className="w-full text-sm"
      placeholder="Judging notes..."
    />
  );
}

interface ProjectDetailPaneProps {
  readonly project: Project | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onRerun: () => void;
}

export function ProjectDetailPane({
  project,
  open,
  onOpenChange,
  onRerun,
}: ProjectDetailPaneProps) {
  const {
    prizeCategoryRecord: prizeCategoryMap,
    prizeCategoryNameMap,
    prizeCategories,
  } = usePrizeCategories();
  const { favoriteProjects, toggleFavoriteProject } = useStore();

  if (!project) return null;

  const disableAnalysis = project.status?.startsWith("processing") ?? false;
  const rerunLabel = project.status === "unprocessed" ? "Run" : "Re-run";

  const handleCopyCopilotPrompt = async () => {
    try {
      if (!navigator?.clipboard?.writeText) {
        toast.error("Clipboard access is not available in this browser.");
        return;
      }

      const prompt = buildCopilotChatPrompt(project, prizeCategories);

      await navigator.clipboard.writeText(prompt);

      toast.success("Prompt copied. Open GitHub Copilot and paste it.", {
        action: {
          label: "Open Copilot",
          onClick: () => {
            window.open("https://github.com/copilot", "_blank", "noopener");
          },
        },
      });
    } catch (error) {
      console.error("Failed to copy Copilot prompt", error);
      toast.error("Could not copy the Copilot prompt. Please try again.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-4xl p-0 flex flex-col h-full gap-0"
        onInteractOutside={(e: {
          detail: { originalEvent: Event };
          preventDefault: () => void;
        }) => {
          const { originalEvent } = e.detail;
          const target = originalEvent.target as HTMLElement;
          if (
            target.closest(".sonner-toast") ||
            target.closest("[data-sonner-toast]")
          ) {
            e.preventDefault();
          }
        }}
      >
        <div className="p-8 border-b bg-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleFavoriteProject(project.id)}
                  className="group p-1.5 hover:bg-gray-100 rounded-md transition-all border border-transparent hover:border-gray-200 outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                  aria-label={
                    favoriteProjects.includes(project.id)
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      favoriteProjects.includes(project.id)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 group-hover:text-gray-400"
                    }`}
                  />
                </button>
                <SheetTitle className="text-4xl font-bold text-gray-900 font-headline wrap-break-word leading-tight">
                  {project.project_title}
                </SheetTitle>
                <div className="flex items-center gap-2 shrink-0">
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-900 transition-colors"
                      title="GitHub Repository"
                    >
                      <GithubIcon className="w-6 h-6" />
                    </a>
                  )}
                  {project.submission_url && (
                    <a
                      href={project.submission_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#003E54] transition-colors"
                      title="Devpost Submission"
                    >
                      <DevpostIcon className="w-6 h-6" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={onRerun}
                disabled={disableAnalysis}
                variant="outline"
              >
                <Play className="h-4 w-4" />
                {rerunLabel}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-6 space-y-4 bg-gray-50/50">
            {/* Code Review Agent Section */}
            {/*! Bento Box Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Technical Complexity */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <LayoutTemplate className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Technical Complexity
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-bold text-gray-900 capitalize">
                      {project.technical_complexity || "N/A"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Based on tech stack and feature analysis
                  </p>
                </div>
              </div>

              {/* Description Accuracy */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <Info className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Description Accuracy
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-bold text-gray-900 capitalize">
                      {project.description_accuracy_level || "N/A"}
                    </span>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <Markdown className="text-gray-600 line-clamp-2">
                            {project.description_accuracy_message ||
                              "No details available"}
                          </Markdown>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-md">
                        <Markdown className="text-gray-700">
                          {project.description_accuracy_message ||
                            "No details available"}
                        </Markdown>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* Code Review Agent Section */}
            {project.technical_complexity_message && (
              <div className="border border-purple-100 rounded-xl p-5 bg-linear-to-br from-purple-50 to-blue-50 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-(--mlh-purple) flex items-center justify-center shrink-0">
                    <Code2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      Code Review
                    </h3>
                    <Markdown className="text-gray-700">
                      {project.technical_complexity_message}
                    </Markdown>
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap gap-2">
                    {project.tech_stack.map((tech) => (
                      <Badge
                        key={tech}
                        variant="secondary"
                        className="bg-white text-gray-700 hover:bg-gray-50"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Prize Tracks Section */}
            {(() => {
              const prizeTracks = getPrizeTracks(project);
              const prizeResults = parsePrizeResults(project.prize_results);
              const hasPrizeTracks = prizeTracks.length > 0;
              const hasPrizeResults =
                prizeResults && Object.keys(prizeResults).length > 0;
              const showPrizeTracks = hasPrizeTracks || hasPrizeResults;
              if (!showPrizeTracks) return null;

              const unsortedTracks =
                prizeTracks.length > 0
                  ? prizeTracks
                  : prizeResults
                    ? Object.keys(prizeResults)
                    : [];

              const tracksToShow = [...unsortedTracks].sort((a, b) => {
                const getStatus = (slug: string) => {
                  const result = prizeResults ? prizeResults[slug] : null;
                  return getPrizeStatusDisplay(result).status;
                };

                const statusOrder: Record<string, number> = {
                  valid: 0,
                  invalid: 1,
                  processing: 2,
                  errored: 4,
                };

                const statusA = getStatus(a) || "unprocessed";
                const statusB = getStatus(b) || "unprocessed";

                const rankA = statusOrder[statusA] ?? 3; // 3 for unprocessed/default
                const rankB = statusOrder[statusB] ?? 3;

                return rankA - rankB;
              });

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {tracksToShow.map((trackSlug) => {
                      const result = prizeResults
                        ? prizeResults[trackSlug]
                        : null;
                      const fullName =
                        prizeCategoryNameMap.get(trackSlug) ||
                        prizeCategoryMap[trackSlug] ||
                        trackSlug;
                      const { status, message } = getPrizeStatusDisplay(result);

                      let StatusIcon = null;

                      if (status === "valid") {
                        StatusIcon = (
                          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          </div>
                        );
                      } else if (status === "invalid") {
                        StatusIcon = (
                          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                            <HelpCircle className="w-5 h-5 text-orange-600" />
                          </div>
                        );
                      } else if (status === "processing") {
                        StatusIcon = (
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                          </div>
                        );
                      } else if (status === "errored") {
                        StatusIcon = (
                          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                            <XCircle className="w-5 h-5 text-red-600" />
                          </div>
                        );
                      } else {
                        StatusIcon = (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                          </div>
                        );
                      }

                      return (
                        <div
                          key={trackSlug}
                          className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start gap-4">
                            {StatusIcon}
                            <div className="space-y-1">
                              <h4 className="text-xl font-semibold text-gray-900">
                                {fullName}
                              </h4>
                              <Markdown className="text-gray-600 leading-relaxed">
                                {message}
                              </Markdown>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Judging Section Sticky Footer */}
        <div className="p-4 border-t bg-white shrink-0 z-40">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-indigo-900 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <Gavel className="w-4 h-4 text-indigo-600" />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <JudgingScoreInput project={project} />
            </div>

            <div className="flex items-center gap-2 flex-1">
              <NotesInput project={project} />
            </div>

            <div className="w-12"></div>
          </div>
        </div>

        <div className="fixed bottom-3 right-4 z-50">
          <Button
            size="icon"
            className="rounded-full h-12 w-12 shadow-lg bg-gray-900 text-white hover:bg-gray-800"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleCopyCopilotPrompt();
            }}
            aria-label="Chat with GitHub Copilot"
          >
            <GithubCopilotIcon className="size-7" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
