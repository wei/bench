"use client";

import {
  CheckCircle2,
  Code2,
  Gauge,
  Gift,
  Layers,
  Play,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DevpostIcon } from "@/components/icons/devpost-icon";
import { GithubIcon } from "@/components/icons/github-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getPrizeCategories } from "@/lib/data-service";
import {
  getCodeReview,
  getDevpostUrl,
  getMetrics,
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
  const [prizeCategoryMap, setPrizeCategoryMap] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    getPrizeCategories().then((categories) => {
      const mapped = categories.reduce<Record<string, string>>(
        (acc, category) => {
          acc[category.slug] = category.name;
          return acc;
        },
        {},
      );
      setPrizeCategoryMap(mapped);
    });
  }, []);

  if (!project) return null;

  const devpostUrl = getDevpostUrl(project);
  const codeReview = getCodeReview(project);
  const metrics = getMetrics(project);
  const prizeResults = parsePrizeResults(project.prize_results);
  const canRunAnalysis =
    project.status === "unprocessed" || project.status === "processed";

  const metricsData = metrics
    ? [
        { name: "Complexity", value: metrics.complexity, icon: Gauge },
        { name: "Quality", value: metrics.quality, icon: Sparkles },
        { name: "Completeness", value: metrics.completeness, icon: Layers },
      ]
    : [
        { name: "Complexity", value: 0, icon: Gauge },
        { name: "Quality", value: 0, icon: Sparkles },
        { name: "Completeness", value: 0, icon: Layers },
      ];

  const getBarColor = (value: number) => {
    if (value >= 80) return "#3aba96";
    if (value >= 60) return "#1d539f";
    if (value >= 40) return "#f8b92a";
    return "#e73427";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto p-0">
        <div className="p-8 border-b bg-linear-to-br from-white to-gray-50 dark:from-[#262626] dark:to-[#1f1f1f]">
          <SheetHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-3xl md:text-4xl lg:text-5xl font-bold text-(--mlh-dark-grey) dark:text-white font-headline wrap-break-word leading-tight">
                  {project.project_title}
                </SheetTitle>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={onRerun}
                  disabled={!canRunAnalysis}
                  className="bg-(--mlh-blue) hover:bg-(--mlh-blue)/90 text-white gap-2"
                >
                  <Play className="h-4 w-4" />
                  Re-run
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-6 bg-gray-50 dark:bg-[#171717]">
          {/* Top info row: links, similarity, processed */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div className="rounded-lg border bg-white dark:bg-[#262626] p-4 space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Links
              </h3>
              <div className="space-y-2">
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-(--mlh-blue) hover:underline"
                  >
                    <GithubIcon className="w-4 h-4" />
                    GitHub Repository
                  </a>
                )}
                {(project.submission_url || devpostUrl) && (
                  <a
                    href={project.submission_url || devpostUrl || ""}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-(--mlh-blue) hover:underline"
                  >
                    <DevpostIcon className="w-4 h-4" />
                    Devpost Submission
                  </a>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-white dark:bg-[#262626] p-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Similarity Score
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-(--mlh-dark-grey) dark:text-white">
                  {project.code_to_description_similarity_score !== null &&
                  project.code_to_description_similarity_score !== undefined
                    ? project.code_to_description_similarity_score.toFixed(0)
                    : "0"}
                </span>
                <span className="text-xl text-gray-400">/ 10</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Code to description similarity
              </p>
            </div>

            <div className="rounded-lg border bg-white dark:bg-[#262626] p-4 flex items-center justify-between gap-2">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </h3>
              </div>
              {project.status === "processed" ? (
                <Badge className="bg-(--mlh-teal) text-white">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Processed
                </Badge>
              ) : (
                <Badge variant="secondary">Pending</Badge>
              )}
            </div>
          </div>

          {codeReview && (
            <div className="border rounded-lg p-4 bg-linear-to-br from-purple-50 to-blue-50 dark:bg-[#171717]">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-(--mlh-purple) flex items-center justify-center shrink-0">
                  <Code2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-(--mlh-dark-grey) dark:text-white mb-1">
                    Code Review Agent
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-400">
                    {codeReview.review_description}
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                  Tech Stack
                </p>
                <div className="flex flex-wrap gap-2">
                  {codeReview.tech_stack.map((tech) => (
                    <Badge
                      key={tech}
                      variant="secondary"
                      className="bg-white dark:bg-[#262626]"
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              {codeReview.additional_notes && (
                <div className="text-sm text-gray-600 dark:text-gray-400 italic border-t pt-3 mt-3">
                  {codeReview.additional_notes}
                </div>
              )}
            </div>
          )}

          {/* Prize Tracks (eligibility results) */}
          {(() => {
            const prizeTracks = getPrizeTracks(project);
            const showPrizeTracks =
              prizeTracks.length > 0 ||
              (prizeResults && Object.keys(prizeResults).length > 0);
            const isProcessing = project.status.startsWith("processing");

            if (!showPrizeTracks) return null;

            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-(--mlh-yellow)" />
                  <h3 className="font-semibold text-(--mlh-dark-grey) dark:text-white">
                    Prize Tracks
                  </h3>
                </div>
                <div className="space-y-3">
                  {prizeTracks.map((trackSlug) => {
                    const result = prizeResults
                      ? prizeResults[trackSlug]
                      : null;
                    const displayName =
                      prizeCategoryMap[trackSlug] || trackSlug;

                    let status:
                      | "valid"
                      | "invalid"
                      | "pending"
                      | "processing"
                      | "error" = "pending";
                    let color =
                      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"; // pending (white/gray)
                    let reason = "Assessment pending";

                    if (result) {
                      if (result.status === "valid") {
                        status = "valid";
                        color =
                          "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
                        reason = result.message || "Criteria met";
                      } else if (result.status === "invalid") {
                        status = "invalid";
                        color =
                          "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
                        reason = result.message || "Criteria not met";
                      } else if ((result as any).status === "error") {
                        status = "error";
                        color =
                          "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
                        reason = result.message || "Error during assessment";
                      }
                    } else if (isProcessing) {
                      status = "processing";
                      color =
                        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 animate-pulse";
                      reason = "Assessment in progress...";
                    }

                    return (
                      <div
                        key={trackSlug}
                        className="border rounded-lg p-3 bg-gray-50 dark:bg-[#262626]"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm text-(--mlh-dark-grey) dark:text-white">
                            {displayName}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`border-0 ${color}`}
                          >
                            {status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {reason}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 gap-6">
            {/* Metrics */}
            <div className="bg-white dark:bg-[#262626] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="w-4 h-4 text-(--mlh-yellow)" />
                <h3 className="font-semibold text-(--mlh-dark-grey) dark:text-white">
                  Metrics
                </h3>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {metricsData.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div
                      key={metric.name}
                      className="border rounded-lg p-3 bg-gray-50 dark:bg-[#1f1f1f] space-y-2"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-(--mlh-dark-grey) dark:text-white">
                        <Icon className="w-4 h-4 text-(--mlh-yellow)" />
                        {metric.name}
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-bold text-(--mlh-dark-grey) dark:text-white">
                          {metric.value}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${metric.value}%`,
                            backgroundColor: getBarColor(metric.value),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
