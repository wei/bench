"use client";

import {
  CheckCircle2,
  Code2,
  HelpCircle,
  Info,
  LayoutTemplate,
  Loader2,
  Play,
  XCircle,
} from "lucide-react";
import { DevpostIcon } from "@/components/icons/devpost-icon";
import { GithubIcon } from "@/components/icons/github-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { usePrizeCategories } from "@/hooks/use-prize-categories";
import {
  getCodeReview,
  getPrizeStatusDisplay,
  getPrizeTracks,
  parsePrizeResults,
} from "@/lib/project-utils";
import type { Project } from "@/lib/store";

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
  const { prizeCategoryRecord: prizeCategoryMap, prizeCategoryNameMap } =
    usePrizeCategories();

  if (!project) return null;

  const codeReview = getCodeReview(project);
  const _prizeResults = parsePrizeResults(project.prize_results);
  const canRunAnalysis =
    project.status === "unprocessed" || project.status === "processed";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto p-0">
        <div>
          <div className="p-8 border-b bg-white">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
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
                  disabled={!canRunAnalysis}
                  className="bg-(--mlh-blue) hover:bg-(--mlh-blue)/90 text-white gap-2 shadow-sm"
                >
                  <Play className="h-4 w-4" />
                  Re-run
                </Button>
              </div>
            </div>
          </div>

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
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {project.description_accuracy_message ||
                      "No details available"}
                  </p>
                </div>
              </div>
            </div>

            {/* Code Review Agent Section */}
            {/* Code Review Agent Section */}
            {codeReview && (
              <div className="border border-purple-100 rounded-xl p-5 bg-linear-to-br from-purple-50 to-blue-50 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-(--mlh-purple) flex items-center justify-center shrink-0">
                    <Code2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      Code Review
                    </h3>
                    <p className="text-sm text-gray-700">
                      {codeReview.review_description}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap gap-2">
                    {codeReview.tech_stack.map((tech) => (
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

                {codeReview.additional_notes && (
                  <div className="text-sm text-gray-600 italic border-t pt-3 mt-3">
                    {codeReview.additional_notes}
                  </div>
                )}
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
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {message}
                              </p>
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
      </SheetContent>
    </Sheet>
  );
}
