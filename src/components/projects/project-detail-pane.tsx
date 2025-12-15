"use client";

import { CheckCircle2, Code2, ExternalLink, Gift, Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Project } from "@/lib/store";
import {
  getDevpostUrl,
  getTeamMembers,
  getCodeReview,
  getMetrics,
  parsePrizeResults,
  formatCategoryName,
  getPrizeTracks,
} from "@/lib/project-utils";

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
  if (!project) return null;

  const devpostUrl = getDevpostUrl(project);
  const teamMembers = getTeamMembers(project);
  const codeReview = getCodeReview(project);
  const metrics = getMetrics(project);
  const prizeResults = parsePrizeResults(project.prize_results);
  const prizeTracks = getPrizeTracks(project);

  const metricsData = metrics
    ? [
        { name: "Complexity", value: metrics.complexity },
        { name: "Quality", value: metrics.quality },
        { name: "Completeness", value: metrics.completeness },
      ]
    : [
        { name: "Complexity", value: 0 },
        { name: "Quality", value: 0 },
        { name: "Completeness", value: 0 },
      ];

  const getBarColor = (value: number) => {
    if (value >= 80) return "#3aba96";
    if (value >= 60) return "#1d539f";
    if (value >= 40) return "#f8b92a";
    return "#e73427";
  };

  // team name from csv_row
  const teamName =
    project.csv_row &&
    typeof project.csv_row === "object" &&
    "team_name" in project.csv_row
      ? (project.csv_row.team_name as string)
      : "Unknown Team";

  // tagline from csv_row
  const tagline =
    project.csv_row &&
    typeof project.csv_row === "object" &&
    "tagline" in project.csv_row
      ? (project.csv_row.tagline as string)
      : "AI-powered innovation";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-0">
        <div className="p-6 border-b bg-white dark:bg-[#262626]">
          <SheetHeader>
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-2xl font-bold text-(--mlh-dark-grey) dark:text-white font-headline">
                  {project.project_title}
                </SheetTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {tagline}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={onRerun}
                  className="bg-(--mlh-red) hover:bg-[#c92a1f] text-white"
                >
                  Re-run Agents
                </Button>
              </div>
            </div>
            <Badge
              variant={project.status === "processed" ? "default" : "secondary"}
              className={
                project.status === "processed"
                  ? "bg-(--mlh-teal) text-white w-fit mt-2"
                  : "w-fit mt-2"
              }
            >
              {project.status === "processed" && (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              )}
              {project.status === "processed" ? "Completed" : "Pending"}
            </Badge>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-6 bg-gray-50 dark:bg-[#171717]">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                TEAM
              </h3>
              <p className="font-semibold text-(--mlh-dark-grey) dark:text-white">
                {teamName}
              </p>
              {teamMembers[0] && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {teamMembers[0].name}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                LINKS
              </h3>
              <div className="space-y-1">
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-(--mlh-blue) hover:underline"
                  >
                    <Github className="w-4 h-4" />
                    GitHub Repository
                  </a>
                )}
                {devpostUrl && (
                  <a
                    href={devpostUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-(--mlh-blue) hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Devpost Submission
                  </a>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                OVERALL SCORE
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-(--mlh-dark-grey) dark:text-white">
                  {metrics
                    ? (
                        (metrics.complexity +
                          metrics.quality +
                          metrics.completeness) /
                        30
                      ).toFixed(1)
                    : "0.0"}
                </span>
                <span className="text-xl text-gray-400">/ 10</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Based on complexity & quality
              </p>
            </div>
          </div>

          {teamMembers.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-(--mlh-dark-grey)">
                Team Members
              </h3>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={`${member.name}-${member.github_username || member.devpost_username || ""}`}
                    className="border rounded-lg p-4 bg-gray-50 dark:bg-[#262626]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-(--mlh-dark-grey) dark:text-white">
                        {member.name}
                      </p>
                      <div className="flex gap-2">
                        {member.github_username && (
                          <a
                            href={`https://github.com/${member.github_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-(--mlh-dark-grey) text-white hover:bg-gray-800 transition-colors"
                          >
                            <Github className="w-3 h-3" />
                            GitHub
                          </a>
                        )}
                        {member.devpost_username && (
                          <a
                            href={`https://devpost.com/${member.devpost_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-(--mlh-blue) text-white hover:bg-[#164179] transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Devpost
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {member.github_repos_count !== undefined && (
                        <span>
                          <strong className="text-(--mlh-dark-grey) dark:text-white">
                            {member.github_repos_count}
                          </strong>{" "}
                          GitHub repos
                        </span>
                      )}
                      {member.devpost_projects_count !== undefined && (
                        <span>
                          <strong className="text-(--mlh-dark-grey) dark:text-white">
                            {member.devpost_projects_count}
                          </strong>{" "}
                          Devpost projects
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {prizeTracks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-(--mlh-yellow)" />
                <h3 className="font-semibold text-(--mlh-dark-grey) dark:text-white">
                  Prize Tracks
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {prizeTracks.map((track) => (
                  <Badge
                    key={track}
                    className="bg-(--mlh-yellow) text-(--mlh-dark-grey) dark:bg-[#e0a520] dark:text-white hover:bg-[#e0a520]"
                  >
                    {track}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Prize Eligibility Results */}
          {prizeResults && Object.keys(prizeResults).length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-(--mlh-dark-grey) dark:text-white">
                Prize Eligibility Results
              </h3>
              <div className="space-y-3">
                {Object.entries(prizeResults).map(([category, result]) => (
                  <div
                    key={category}
                    className="border rounded-lg p-3 bg-gray-50 dark:bg-[#262626]"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-(--mlh-dark-grey) dark:text-white">
                        {formatCategoryName(category)}
                      </h4>
                      <Badge
                        variant={
                          result.status === "valid" ? "default" : "destructive"
                        }
                        className={
                          result.status === "valid"
                            ? "bg-(--mlh-teal) text-white dark:bg-[#3aba96] dark:text-white"
                            : "bg-red-500 text-white dark:bg-red-500 dark:text-white"
                        }
                      >
                        {result.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {result.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* Prize Eligibility */}
            <div className="bg-white dark:bg-[#262626] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5 text-(--mlh-yellow)" />
                <h3 className="font-semibold text-(--mlh-dark-grey) dark:text-white">
                  Prize Eligibility
                </h3>
              </div>

              {prizeResults && Object.keys(prizeResults).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(prizeResults)
                    .slice(0, 1)
                    .map(([category, result]) => (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm text-(--mlh-dark-grey) dark:text-white">
                            {formatCategoryName(category)}
                          </h4>
                          <Badge
                            className={
                              result.status === "valid"
                                ? "bg-(--mlh-teal) text-white dark:bg-[#3aba96] dark:text-white"
                                : "bg-red-500 text-white dark:bg-red-500 dark:text-white"
                            }
                          >
                            {result.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {result.reason}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No prize analysis available yet
                </p>
              )}
            </div>

            {/* Metrics */}
            <div className="bg-white dark:bg-[#262626] rounded-lg p-6">
              <h3 className="font-semibold text-(--mlh-dark-grey) dark:text-white mb-4">
                Metrics
              </h3>
              <div className="space-y-4">
                {metricsData.map((metric) => (
                  <div key={metric.name}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        {metric.name}
                      </span>
                      <span className="font-semibold text-(--mlh-dark-grey) dark:text-white">
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
                ))}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
