"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { Play, Star } from "lucide-react";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DevpostIcon } from "@/components/icons/devpost-icon";
import { GithubIcon } from "@/components/icons/github-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Tables } from "@/database.types";
import { useDataTable } from "@/hooks/use-data-table";
import { getPrizeCategories } from "@/lib/data-service";
import {
  getComplexityColor,
  getDevpostUrl,
  getPrizeTracks,
  getStatusColor,
  getStatusDescription,
} from "@/lib/project-utils";
import type { Project, ProjectProcessingStatus } from "@/lib/store";
import { useStore } from "@/lib/store";
import { toTitleCase } from "@/lib/utils/string-utils";

type PrizeCategory = Tables<"prize_categories">;

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

export function ProjectTableNew({
  projects,
  onRunAnalysis,
  onBatchRun,
  onImport,
  onProjectClick,
}: ProjectTableProps) {
  const { favoriteProjects, toggleFavoriteProject } = useStore();
  const [title] = useQueryState("title", parseAsString.withDefault(""));
  const [status] = useQueryState(
    "status",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [complexity] = useQueryState(
    "complexity",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [prizeCategories, setPrizeCategories] = React.useState<PrizeCategory[]>(
    [],
  );

  React.useEffect(() => {
    let isActive = true;
    getPrizeCategories().then((categories) => {
      if (isActive) {
        setPrizeCategories(categories);
      }
    });
    return () => {
      isActive = false;
    };
  }, []);

  const prizeCategoryMap = React.useMemo(() => {
    const map = new Map<string, string>();
    prizeCategories.forEach((cat) => {
      map.set(cat.slug, cat.name);
    });
    return map;
  }, [prizeCategories]);

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

      return matchesTitle && matchesStatus && matchesComplexity;
    });
  }, [projects, title, status, complexity]);

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
        cell: ({ cell }) => {
          const status = cell.getValue<ProjectProcessingStatus>();
          return (
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${getStatusColor(status)}`}
              />
              <span className="text-xs text-muted-foreground">
                {getStatusDescription(status)}
              </span>
            </div>
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
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => onProjectClick(row.original)}
            className="text-left hover:text-primary transition-colors font-medium underline cursor-pointer"
          >
            {row.original.project_title}
          </button>
        ),
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
          const devpostUrl = getDevpostUrl(project);
          const submissionUrl = project.submission_url;
          return (
            <div className="flex gap-2">
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
              {!submissionUrl && devpostUrl && (
                <a
                  href={devpostUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                  aria-label="View Devpost project"
                >
                  <DevpostIcon className="h-4 w-4" />
                </a>
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
        accessorFn: (row) => getPrizeTracks(row).join(", "),
        header: "Prize Tracks",
        cell: ({ row }) => {
          const prizeTracks = getPrizeTracks(row.original);
          return (
            <div className="flex flex-wrap gap-1 max-w-[140px]">
              {prizeTracks.length > 0 ? (
                prizeTracks.map((trackSlug) => {
                  const displayName = getPrizeDisplayName(trackSlug);
                  return (
                    <Badge
                      key={trackSlug}
                      variant="outline"
                      className="text-xs"
                    >
                      {displayName}
                    </Badge>
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
        size: 140,
      },
      {
        id: "tech_stack",
        accessorKey: "tech_stack",
        header: "Tech Stack",
        cell: ({ cell }) => {
          const techStack = cell.getValue<string[]>();
          return (
            <div className="flex flex-wrap gap-1 max-w-[180px]">
              {techStack && techStack.length > 0 ? (
                <>
                  {techStack.slice(0, 3).map((tech) => (
                    <Badge key={tech} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {techStack.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{techStack.length - 3}
                    </Badge>
                  )}
                </>
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
  ]);

  const { table } = useDataTable({
    data: filteredData,
    columns,
    pageCount: 1,
    initialState: {
      sorting: [{ id: "project_title", desc: false }],
      columnPinning: { left: ["select", "favorite"], right: ["actions"] },
    },
    getRowId: (row) => row.id,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);

  const handleRunAll = () => {
    const allIds = filteredData.map((p) => p.id);
    onBatchRun(allIds);
  };

  const allProcessed =
    filteredData.length > 0 &&
    filteredData.every((p) => p.status === "processed");
  const hasNoProjects = filteredData.length === 0;

  const actionBar = (
    <div className="flex items-center justify-between">
      <div className="flex-1 text-sm text-muted-foreground">
        {selectedIds.length > 0 && (
          <span>
            {selectedIds.length} of {filteredData.length} row(s) selected.
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <DataTable table={table} actionBar={actionBar}>
        <DataTableToolbar
          table={table}
          onRunAll={handleRunAll}
          onRunSelected={(ids) => onBatchRun(ids)}
          onImport={onImport}
          allProcessed={allProcessed}
          hasNoProjects={hasNoProjects}
        />
      </DataTable>
    </div>
  );
}
