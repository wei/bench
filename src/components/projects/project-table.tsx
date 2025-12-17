"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { Play, Star } from "lucide-react";
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DevpostIcon } from "@/components/icons/devpost-icon";
import { GithubIcon } from "@/components/icons/github-icon";
import { ProcessingModal } from "@/components/processing-modal";
import { StatusBadge } from "@/components/status/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDataTable } from "@/hooks/use-data-table";
import { usePrizeCategories } from "@/hooks/use-prize-categories";
import {
  getComplexityColor,
  getPrizeStatusDisplay,
  getPrizeTracks,
  getStatusTooltipMessage,
  parsePrizeResults,
} from "@/lib/project-utils";
import type { Project, ProjectProcessingStatus } from "@/lib/store";
import { useStore } from "@/lib/store";
import { toTitleCase } from "@/lib/utils/string-utils";

interface ProjectTableProps {
  readonly projects: Project[];
  readonly onRunAnalysis: (projectId: string) => void;
  readonly onBatchRun: (projectIds: string[]) => void;
  readonly onImport: () => void;
  readonly onProjectClick: (project: Project) => void;
}

// Status options for filtering
const statusOptions: Array<{
  label: string;
  value: ProjectProcessingStatus;
}> = [
  { label: "Unprocessed", value: "unprocessed" },
  { label: "Processing: Code Review", value: "processing:code_review" },
  {
    label: "Processing: Prize Category Review",
    value: "processing:prize_category_review",
  },
  { label: "Processed", value: "processed" },
  {
    label: "Invalid: GitHub Inaccessible",
    value: "invalid:github_inaccessible",
  },
  { label: "Invalid: Rule Violation", value: "invalid:rule_violation" },
];

// Complexity options for filtering
const complexityOptions = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

// Helper function to check if a project is failed/invalid/errored
function isFailedOrInvalidOrErrored(status: ProjectProcessingStatus): boolean {
  return status === "errored" || status.startsWith("invalid:");
}

export function ProjectTable({
  projects,
  onRunAnalysis,
  onBatchRun,
  onImport,
  onProjectClick,
}: ProjectTableProps) {
  const { favoriteProjects, toggleFavoriteProject } = useStore();
  const [title] = useQueryState("title", parseAsString.withDefault(""));
  const [status, setStatus] = useQueryState(
    "status",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [complexity, setComplexity] = useQueryState(
    "complexity",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [prizeTrack, setPrizeTrack] = useQueryState(
    "prizeTrack",
    parseAsString,
  );
  const [techStack, setTechStack] = useQueryState(
    "techStack",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [techStackMode, setTechStackMode] = useQueryState(
    "techStackMode",
    parseAsStringLiteral(["intersection", "union"] as const).withDefault(
      "union",
    ),
  );
  const [hasGithub, setHasGithub] = useQueryState(
    "hasGithub",
    parseAsStringLiteral(["true", "false"] as const),
  );
  const { prizeCategoryMap, prizeCategoryNameMap, prizeCategories } =
    usePrizeCategories();

  // Get unique tech stack values from all projects
  // Deduplicate case-insensitively, preferring capitalized versions
  const uniqueTechStack = React.useMemo(() => {
    const techMap = new Map<string, string>(); // lowercase -> preferred version
    projects.forEach((project) => {
      project.tech_stack?.forEach((tech) => {
        if (tech) {
          const lowerKey = tech.toLowerCase();
          const existing = techMap.get(lowerKey);
          if (!existing) {
            // First occurrence - use it
            techMap.set(lowerKey, tech);
          } else {
            // Prefer version with first letter capitalized
            const existingFirstUpper =
              existing.charAt(0).toUpperCase() +
              existing.slice(1).toLowerCase();
            const techFirstUpper =
              tech.charAt(0).toUpperCase() + tech.slice(1).toLowerCase();
            if (existing !== existingFirstUpper && tech === techFirstUpper) {
              techMap.set(lowerKey, tech);
            } else if (
              existing === existingFirstUpper &&
              tech !== techFirstUpper
            ) {
              // Keep existing if it's already capitalized
            } else if (
              existing.charAt(0) !== existing.charAt(0).toUpperCase() &&
              tech.charAt(0) === tech.charAt(0).toUpperCase()
            ) {
              // Prefer capitalized version
              techMap.set(lowerKey, tech);
            }
          }
        }
      });
    });
    return Array.from(techMap.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [projects]);

  // Filter data client-side based on URL state
  const filteredData = React.useMemo(() => {
    return projects.filter((project) => {
      const matchesTitle =
        title === "" ||
        project.project_title?.toLowerCase().includes(title.toLowerCase());
      const matchesStatus =
        status.length === 0 || status.includes(project.status);
      const matchesComplexity =
        complexity.length === 0 ||
        (project.technical_complexity &&
          complexity.includes(project.technical_complexity));

      // Prize track filter (single selection)
      const matchesPrizeTrack =
        !prizeTrack || getPrizeTracks(project).includes(prizeTrack);

      // Tech stack filter (intersection or union, case-insensitive)
      const matchesTechStack =
        techStack.length === 0 ||
        (project.tech_stack &&
          project.tech_stack.length > 0 &&
          (techStackMode === "intersection"
            ? techStack.every((filterTech) =>
                project.tech_stack.some(
                  (projectTech) =>
                    projectTech.toLowerCase() === filterTech.toLowerCase(),
                ),
              )
            : techStack.some((filterTech) =>
                project.tech_stack.some(
                  (projectTech) =>
                    projectTech.toLowerCase() === filterTech.toLowerCase(),
                ),
              )));

      // GitHub filter
      const matchesGithub =
        hasGithub === null ||
        (hasGithub === "true" ? !!project.github_url : !project.github_url);

      return (
        matchesTitle &&
        matchesStatus &&
        matchesComplexity &&
        matchesPrizeTrack &&
        matchesTechStack &&
        matchesGithub
      );
    });
  }, [
    projects,
    title,
    status,
    complexity,
    prizeTrack,
    techStack,
    techStackMode,
    hasGithub,
  ]);

  const handleToggleFavorite = React.useCallback(
    async (projectId: string) => {
      toggleFavoriteProject(projectId);
    },
    [toggleFavoriteProject],
  );

  const columns = React.useMemo<ColumnDef<Project>[]>(() => {
    const getPrizeDisplayName = (slug: string) => {
      return prizeCategoryMap.get(slug) || slug;
    };

    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        size: 40,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "favorite",
        header: () => null,
        cell: ({ row }) => {
          const isFavorite = favoriteProjects.includes(row.original.id);
          return (
            <button
              type="button"
              onClick={() => handleToggleFavorite(row.original.id)}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-all border border-transparent hover:border-gray-300 shadow-sm hover:shadow"
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              <Star
                className={`h-4 w-4 ${
                  isFavorite
                    ? "fill-yellow-500 text-yellow-500"
                    : "text-gray-400"
                }`}
              />
            </button>
          );
        },
        size: 48,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }: { column: Column<Project, unknown> }) => (
          <DataTableColumnHeader column={column} label="Status" />
        ),
        cell: ({ cell, row }) => {
          const status = cell.getValue<ProjectProcessingStatus>();
          return (
            <StatusBadge
              kind="project"
              status={status}
              tooltip={getStatusTooltipMessage(row.original)}
            />
          );
        },
        meta: {
          label: "Status",
          variant: "multiSelect" as const,
          options: statusOptions.map((opt) => ({
            label: opt.label,
            value: opt.value,
          })),
        },
        enableColumnFilter: true,
        size: 140,
      },
      {
        id: "project_title",
        accessorKey: "project_title",
        header: ({ column }: { column: Column<Project, unknown> }) => (
          <DataTableColumnHeader column={column} label="Project" />
        ),
        cell: ({ row }) => {
          const project = row.original;

          return (
            <div className="max-w-[150px]">
              <button
                type="button"
                onClick={() => onProjectClick(row.original)}
                className="text-left hover:text-primary transition-colors font-medium underline cursor-pointer truncate block w-full"
                title={project.project_title || undefined}
              >
                {project.project_title}
              </button>
            </div>
          );
        },
        meta: {
          label: "Project Title",
          placeholder: "Search projects...",
          variant: "text" as const,
        },
        enableColumnFilter: true,
        size: 200,
      },
      {
        id: "links",
        header: "Links",
        cell: ({ row }) => {
          const project = row.original;
          const submissionUrl = project.submission_url;

          return (
            <div className="flex gap-1 shrink-0">
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                  aria-label="View GitHub repository"
                >
                  <GithubIcon className="h-4 w-4" />
                </a>
              )}
              {submissionUrl && (
                <a
                  href={submissionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                  aria-label="View Devpost submission"
                >
                  <DevpostIcon className="h-4 w-4" />
                </a>
              )}
              {!project.github_url && !submissionUrl && (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          );
        },
        enableSorting: false,
        size: 80,
      },

      {
        id: "technical_complexity",
        accessorKey: "technical_complexity",
        header: ({ column }: { column: Column<Project, unknown> }) => (
          <DataTableColumnHeader column={column} label="Complexity" />
        ),
        cell: ({ cell }) => {
          const complexity = cell.getValue<string | null>();
          return (
            <Badge className={getComplexityColor(complexity)}>
              {toTitleCase(complexity) || "N/A"}
            </Badge>
          );
        },
        meta: {
          label: "Complexity",
          variant: "multiSelect" as const,
          options: complexityOptions,
        },
        enableColumnFilter: true,
      },
      {
        id: "prize_tracks",
        header: "Prize Tracks",
        cell: ({ row }) => {
          const project = row.original;
          const prizeTracks = getPrizeTracks(project);
          const results = parsePrizeResults(project.prize_results) || {};

          return (
            <div className="flex flex-wrap gap-1 max-w-50">
              {prizeTracks.length > 0 ? (
                prizeTracks.map((trackSlug) => {
                  const result = results[trackSlug];
                  const shortDisplayName = getPrizeDisplayName(trackSlug); // short_name or name fallback
                  const fullName =
                    prizeCategoryNameMap.get(trackSlug) || trackSlug; // full name for tooltip
                  const { status, message } = getPrizeStatusDisplay(result);

                  return (
                    <StatusBadge
                      key={trackSlug}
                      kind="prize"
                      status={status}
                      tooltipTitle={fullName}
                      tooltip={message}
                      className="text-xs"
                    >
                      {shortDisplayName}
                      {status === "valid" && " ✓"}
                      {status === "invalid" && " ?"}
                    </StatusBadge>
                  );
                })
              ) : (
                <span className="text-xs text-muted-foreground">
                  None selected
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
        size: 200,
      },
      {
        id: "tech_stack",
        accessorKey: "tech_stack",
        header: "Tech Stack",
        cell: ({ cell }) => {
          const techStack = cell.getValue<string[]>();
          return (
            <div className="flex flex-wrap gap-1 max-w-45">
              {techStack && techStack.length > 0 ? (
                <TooltipProvider>
                  {techStack.slice(0, 3).map((tech) => (
                    <Badge key={tech} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {techStack.length > 3 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className="text-xs cursor-help hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          +{techStack.length - 3}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="flex flex-col gap-1">
                          <p className="font-semibold text-xs mb-1">
                            Additional Tech:
                          </p>
                          {techStack.slice(3).map((tech) => (
                            <span key={tech} className="text-xs">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TooltipProvider>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Not analyzed
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const status = row.original.status;
          const disableAnalysis = status.startsWith("processing:code_review");
          const label = status === "unprocessed" ? "Run" : "Re-run";

          return (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => onRunAnalysis(row.original.id)}
              disabled={disableAnalysis}
            >
              <Play className="h-4 w-4" />
              {label}
            </Button>
          );
        },
        size: 120,
        enableSorting: false,
      },
    ];
  }, [
    onProjectClick,
    onRunAnalysis,
    favoriteProjects,
    handleToggleFavorite,
    prizeCategoryMap,
    prizeCategoryNameMap,
  ]);

  const { table } = useDataTable({
    data: filteredData,
    columns,
    initialState: {
      sorting: [{ id: "project_title", desc: false }],
      columnPinning: { left: ["select", "favorite"], right: ["actions"] },
    },
    getRowId: (row) => row.id,
  });

  const handleRunAll = () => {
    // Include ALL projects, even invalid or errored ones
    const allIds = filteredData.map((p) => p.id);
    onBatchRun(allIds);
  };

  // Get all failed/invalid/errored project IDs
  const failedInvalidErroredProjects = React.useMemo(() => {
    return filteredData.filter((p) => isFailedOrInvalidOrErrored(p.status));
  }, [filteredData]);

  const handleRerunFailed = () => {
    const failedIds = failedInvalidErroredProjects.map((p) => p.id);
    onBatchRun(failedIds);
  };

  const allProcessed =
    filteredData.length > 0 &&
    filteredData.every((p) => p.status === "processed");
  const hasNoProjects = filteredData.length === 0;
  const hasFailedProjects = failedInvalidErroredProjects.length > 0;

  const { showProcessingModal } = useStore();

  return (
    <div className="space-y-4 relative">
      <DataTable table={table}>
        {/* Overlay background when processing - contained within DataTable */}
        {showProcessingModal && (
          <div className="absolute inset-0 bg-blue-50/20 dark:bg-blue-950/50 backdrop-blur-xs z-40 rounded-md pointer-events-none" />
        )}

        <div
          className={
            showProcessingModal
              ? "opacity-50 pointer-events-none transition-opacity"
              : ""
          }
        >
          <DataTableToolbar
            table={table}
            onRunAll={handleRunAll}
            onRunSelected={(ids) => onBatchRun(ids)}
            onRerunFailed={handleRerunFailed}
            onImport={onImport}
            allProcessed={allProcessed}
            hasNoProjects={hasNoProjects}
            hasFailedProjects={hasFailedProjects}
            failedProjectsCount={failedInvalidErroredProjects.length}
            status={status}
            onStatusChange={setStatus}
            complexity={complexity}
            onComplexityChange={setComplexity}
            prizeTrack={prizeTrack ?? null}
            onPrizeTrackChange={(value) => setPrizeTrack(value)}
            prizeCategories={prizeCategories}
            techStack={techStack}
            onTechStackChange={setTechStack}
            techStackMode={techStackMode}
            onTechStackModeChange={setTechStackMode}
            uniqueTechStack={uniqueTechStack}
            hasGithub={hasGithub ?? null}
            onHasGithubChange={(value) => {
              if (value === null) {
                setHasGithub(null);
              } else if (value === "true" || value === "false") {
                setHasGithub(value);
              }
            }}
            allProjects={projects}
            title={title}
          />
        </div>

        {/* Processing modal - sticky positioned to stay in viewport while scrolling, contained within DataTable */}
        {showProcessingModal && (
          <div className="sticky top-4 z-50 flex justify-center pointer-events-none -mb-4 pb-4">
            <div className="pointer-events-auto w-full max-w-6xl mx-4">
              <ProcessingModal />
            </div>
          </div>
        )}
      </DataTable>
    </div>
  );
}
