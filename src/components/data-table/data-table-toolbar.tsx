"use client";

import type { Table as TanstackTable } from "@tanstack/react-table";
import {
  ChevronDown,
  Download,
  Filter,
  Play,
  RefreshCw,
  Search,
  Upload,
  X,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTableToolbarProps<TData> {
  table: TanstackTable<TData>;
  onRunAll?: () => void;
  onRunSelected?: (selectedIds: string[]) => void;
  onRerunFailed?: () => void;
  onImport?: () => void;
  isJudgingView?: boolean;
  onJudgingViewChange?: (enabled: boolean) => void;
  allProcessed?: boolean;
  hasNoProjects?: boolean;
  hasFailedProjects?: boolean;
  failedProjectsCount?: number;
  // Filter props
  status?: string[];
  onStatusChange?: (status: string[]) => void;
  complexity?: string[];
  onComplexityChange?: (complexity: string[]) => void;
  prizeTrack?: string | null;
  onPrizeTrackChange?: (prizeTrack: string | null) => void;
  prizeCategories?: Array<{
    slug: string;
    name: string;
    short_name: string | null;
  }>;
  techStack?: string[];
  onTechStackChange?: (techStack: string[]) => void;
  techStackMode?: "intersection" | "union";
  onTechStackModeChange?: (mode: "intersection" | "union") => void;
  uniqueTechStack?: string[];
  hasGithub?: string | null;
  onHasGithubChange?: (hasGithub: "true" | "false" | null) => void;
  // For calculating filter counts
  allProjects?: Array<{
    status: string;
    project_title?: string | null;
    technical_complexity?: string | null;
    tech_stack?: string[];
    github_url?: string | null;
    standardized_opt_in_prizes?: string[];
    csv_row?: unknown;
  }>;
  title?: string;
}

export function DataTableToolbar<TData>({
  table,
  onRunAll,
  onRunSelected,
  onRerunFailed,
  onImport,
  isJudgingView = false,
  onJudgingViewChange,
  allProcessed = false,
  hasNoProjects = false,
  hasFailedProjects = false,
  failedProjectsCount = 0,
  status = [],
  onStatusChange,
  complexity = [],
  onComplexityChange,
  prizeTrack,
  onPrizeTrackChange,
  prizeCategories = [],
  techStack = [],
  onTechStackChange,
  techStackMode = "union",
  onTechStackModeChange,
  uniqueTechStack = [],
  hasGithub,
  onHasGithubChange,
  allProjects = [],
  title = "",
}: DataTableToolbarProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map(
    (row) => (row.original as { id: string }).id,
  );
  const hasSelection = selectedIds.length > 0;
  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    status.length > 0 ||
    complexity.length > 0 ||
    prizeTrack !== null ||
    techStack.length > 0 ||
    hasGithub !== null;
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [techStackSearch, setTechStackSearch] = React.useState("");

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      table.setGlobalFilter(globalFilter);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [globalFilter, table]);

  const handleResetFilters = () => {
    table.resetColumnFilters();
    setGlobalFilter("");
    setTechStackSearch("");
    onStatusChange?.([]);
    onComplexityChange?.([]);
    onPrizeTrackChange?.(null);
    onTechStackChange?.([]);
    onHasGithubChange?.(null);
  };

  // Filter tech stack list based on search
  const filteredTechStack = React.useMemo(() => {
    if (!techStackSearch.trim()) {
      return uniqueTechStack;
    }
    const searchLower = techStackSearch.toLowerCase();
    return uniqueTechStack.filter((tech) =>
      tech.toLowerCase().includes(searchLower),
    );
  }, [uniqueTechStack, techStackSearch]);

  // Helper to get prize tracks safely from a project-like object
  const getProjectPrizeTracks = React.useCallback(
    (p: (typeof allProjects)[number]): string[] => {
      if (
        p.standardized_opt_in_prizes &&
        p.standardized_opt_in_prizes.length > 0
      ) {
        return p.standardized_opt_in_prizes;
      }
      if (
        p.csv_row &&
        typeof p.csv_row === "object" &&
        "prize_tracks" in p.csv_row
      ) {
        const tracks = (p.csv_row as { prize_tracks?: unknown }).prize_tracks;
        if (Array.isArray(tracks)) {
          return tracks.filter(
            (track): track is string => typeof track === "string",
          );
        }
      }
      return [];
    },
    [],
  );

  // Calculate filter counts (excluding the filter being counted)
  const getFilterCounts = React.useCallback(
    (
      filterType:
        | "status"
        | "complexity"
        | "prizeTrack"
        | "techStack"
        | "github",
      filterValue: string,
    ) => {
      return allProjects.filter((project) => {
        // Apply all filters except the one being counted
        const matchesTitle =
          title === "" ||
          (project.project_title?.toLowerCase() ?? "").includes(
            title.toLowerCase(),
          );

        // For status: exclude current status filter, but include if it matches the value being counted
        const matchesStatus =
          filterType === "status"
            ? project.status === filterValue
            : status.length === 0 || status.includes(project.status);

        // For complexity: exclude current complexity filter, but include if it matches the value being counted
        const matchesComplexity =
          filterType === "complexity"
            ? project.technical_complexity === filterValue
            : complexity.length === 0 ||
              (project.technical_complexity &&
                complexity.includes(project.technical_complexity));

        // For prize track: exclude current prize track filter, but include if it matches the value being counted
        const projectPrizeTracks = getProjectPrizeTracks(project);
        const matchesPrizeTrack =
          filterType === "prizeTrack"
            ? projectPrizeTracks.includes(filterValue)
            : !prizeTrack || projectPrizeTracks.includes(prizeTrack);

        // For tech stack: exclude current tech stack filter, but include if it matches the value being counted
        const projectTechStack = project.tech_stack ?? [];
        const hasTechStackMatch = (tech: string): boolean =>
          projectTechStack.some(
            (projectTech) => projectTech.toLowerCase() === tech.toLowerCase(),
          );
        const matchesTechStack =
          filterType === "techStack"
            ? hasTechStackMatch(filterValue)
            : techStack.length === 0 ||
              (projectTechStack.length > 0 &&
                (techStackMode === "intersection"
                  ? techStack.every(hasTechStackMatch)
                  : techStack.some(hasTechStackMatch)));

        // For github: exclude current github filter, but include if it matches the value being counted
        const hasGithubUrl = !!project.github_url;
        const matchesGithub =
          filterType === "github"
            ? filterValue === "true"
              ? hasGithubUrl
              : !hasGithubUrl
            : !hasGithub ||
              (hasGithub === "true" ? hasGithubUrl : !hasGithubUrl);

        return (
          matchesTitle &&
          matchesStatus &&
          matchesComplexity &&
          matchesPrizeTrack &&
          matchesTechStack &&
          matchesGithub
        );
      }).length;
    },
    [
      allProjects,
      title,
      status,
      complexity,
      prizeTrack,
      techStack,
      techStackMode,
      hasGithub,
      getProjectPrizeTracks,
    ],
  );

  const runButtonVariant = hasSelection
    ? "default"
    : hasNoProjects || allProcessed
      ? "outline"
      : "default";
  const runButtonClassName = hasSelection
    ? "gap-2 bg-(--mlh-blue) hover:bg-(--mlh-blue)/90 text-white"
    : hasNoProjects || allProcessed
      ? "gap-2"
      : "gap-2 bg-(--mlh-blue) hover:bg-(--mlh-blue)/90 text-white";
  const importVariant = hasNoProjects ? "default" : "outline";
  const importClassName = hasNoProjects
    ? "gap-2 bg-(--mlh-blue) hover:bg-(--mlh-blue)/90 text-white"
    : "gap-2";

  const handleRunClick = () => {
    if (hasSelection && onRunSelected) {
      onRunSelected(selectedIds);
    } else if (onRunAll) {
      onRunAll();
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-10 pl-10 w-full lg:w-[400px]"
          />
        </div>
        {/* Filters */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[250px] max-h-[60vh] overflow-y-auto"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
            }}
          >
            <DropdownMenuLabel>Filters</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Status Filter */}
            <DropdownMenuLabel className="text-xs font-normal">
              Status
            </DropdownMenuLabel>
            {[
              { label: "Unprocessed", value: "unprocessed" },
              {
                label: "Processing: Code Review",
                value: "processing:code_review",
              },
              {
                label: "Processing: Prize Category Review",
                value: "processing:prize_category_review",
              },
              { label: "Processed", value: "processed" },
              {
                label: "Invalid: GitHub Inaccessible",
                value: "invalid:github_inaccessible",
              },
              {
                label: "Invalid: Rule Violation",
                value: "invalid:rule_violation",
              },
              { label: "Errored", value: "errored" },
            ].map((option) => {
              const count = getFilterCounts("status", option.value);
              return (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={status.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (onStatusChange) {
                      if (checked) {
                        onStatusChange([...status, option.value]);
                      } else {
                        onStatusChange(
                          status.filter((s) => s !== option.value),
                        );
                      }
                    }
                  }}
                  onSelect={(e) => e.preventDefault()}
                >
                  <span className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    <Badge
                      variant="secondary"
                      className="ml-2 h-4 min-w-4 px-1 text-[10px] font-normal"
                    >
                      {count}
                    </Badge>
                  </span>
                </DropdownMenuCheckboxItem>
              );
            })}

            <DropdownMenuSeparator />

            {/* Complexity Filter */}
            <DropdownMenuLabel className="text-xs font-normal">
              Complexity
            </DropdownMenuLabel>
            {[
              { label: "Beginner", value: "beginner" },
              { label: "Intermediate", value: "intermediate" },
              { label: "Advanced", value: "advanced" },
            ].map((option) => {
              const count = getFilterCounts("complexity", option.value);
              return (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={complexity.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (onComplexityChange) {
                      if (checked) {
                        onComplexityChange([...complexity, option.value]);
                      } else {
                        onComplexityChange(
                          complexity.filter((c) => c !== option.value),
                        );
                      }
                    }
                  }}
                  onSelect={(e) => e.preventDefault()}
                >
                  <span className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    <Badge
                      variant="secondary"
                      className="ml-2 h-4 min-w-4 px-1 text-[10px] font-normal"
                    >
                      {count}
                    </Badge>
                  </span>
                </DropdownMenuCheckboxItem>
              );
            })}

            <DropdownMenuSeparator />

            {/* Prize Track Filter */}
            <DropdownMenuLabel className="text-xs font-normal">
              Prize Track
            </DropdownMenuLabel>
            <div className="px-2 py-1.5">
              <Select
                value={prizeTrack || "all"}
                onValueChange={(value) => {
                  if (onPrizeTrackChange) {
                    onPrizeTrackChange(value === "all" ? null : value);
                  }
                }}
              >
                <SelectTrigger className="h-8 w-full">
                  <SelectValue placeholder="All Prize Tracks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prize Tracks</SelectItem>
                  {prizeCategories.map((cat) => {
                    const count = getFilterCounts("prizeTrack", cat.slug);
                    return (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        <span className="flex items-center justify-between w-full">
                          <span>{cat.short_name || cat.name}</span>
                          <Badge
                            variant="secondary"
                            className="ml-2 h-4 min-w-4 px-1 text-[10px] font-normal"
                          >
                            {count}
                          </Badge>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <DropdownMenuSeparator />

            {/* Tech Stack Filter */}
            <DropdownMenuLabel className="text-xs font-normal">
              Tech Stack
            </DropdownMenuLabel>
            <div className="px-2 py-1.5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Mode:</span>
                <Select
                  value={techStackMode}
                  onValueChange={(value) => {
                    if (value === "intersection" || value === "union") {
                      onTechStackModeChange?.(value);
                    }
                  }}
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="union">Union (OR)</SelectItem>
                    <SelectItem value="intersection">
                      Intersection (AND)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Search bar for tech stack */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  placeholder="Search tech stack..."
                  value={techStackSearch}
                  onChange={(e) => setTechStackSearch(e.target.value)}
                  className="h-8 pl-7 text-xs"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {filteredTechStack.map((tech) => {
                  const count = getFilterCounts("techStack", tech);
                  return (
                    <div
                      key={tech}
                      className="flex items-center space-x-2 px-2"
                    >
                      <Checkbox
                        id={`tech-${tech}`}
                        checked={techStack.includes(tech)}
                        onCheckedChange={(checked) => {
                          if (onTechStackChange) {
                            if (checked) {
                              onTechStackChange([...techStack, tech]);
                            } else {
                              onTechStackChange(
                                techStack.filter((t) => t !== tech),
                              );
                            }
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        type="button"
                        className="text-sm cursor-pointer flex-1 flex items-center justify-between text-left bg-transparent border-none p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          const checkbox = document.getElementById(
                            `tech-${tech}`,
                          ) as HTMLInputElement;
                          if (checkbox) {
                            checkbox.click();
                          }
                        }}
                      >
                        <span>{tech}</span>
                        <Badge
                          variant="secondary"
                          className="ml-2 h-4 min-w-4 px-1 text-[10px] font-normal"
                        >
                          {count}
                        </Badge>
                      </button>
                    </div>
                  );
                })}
                {filteredTechStack.length === 0 && (
                  <div className="px-2 py-2 text-xs text-muted-foreground text-center">
                    No tech stacks found
                  </div>
                )}
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* GitHub Filter */}
            <DropdownMenuLabel className="text-xs font-normal">
              GitHub
            </DropdownMenuLabel>
            <div className="px-2 py-1.5 space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-github"
                  checked={hasGithub === "true"}
                  onCheckedChange={(checked) => {
                    if (onHasGithubChange) {
                      onHasGithubChange(checked ? "true" : null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const checkbox = document.getElementById(
                      "has-github",
                    ) as HTMLInputElement;
                    if (checkbox) {
                      checkbox.click();
                    }
                  }}
                  className="text-sm cursor-pointer flex items-center justify-between flex-1 text-left bg-transparent border-none p-0"
                >
                  <span>Has GitHub</span>
                  <Badge
                    variant="secondary"
                    className="ml-2 h-4 min-w-4 px-1 text-[10px] font-normal"
                  >
                    {getFilterCounts("github", "true")}
                  </Badge>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="no-github"
                  checked={hasGithub === "false"}
                  onCheckedChange={(checked) => {
                    if (onHasGithubChange) {
                      onHasGithubChange(checked ? "false" : null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const checkbox = document.getElementById(
                      "no-github",
                    ) as HTMLInputElement;
                    if (checkbox) {
                      checkbox.click();
                    }
                  }}
                  className="text-sm cursor-pointer flex items-center justify-between flex-1 text-left bg-transparent border-none p-0"
                >
                  <span>No GitHub</span>
                  <Badge
                    variant="secondary"
                    className="ml-2 h-4 min-w-4 px-1 text-[10px] font-normal"
                  >
                    {getFilterCounts("github", "false")}
                  </Badge>
                </button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleResetFilters}
            className="h-10 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!isJudgingView && (onRunAll || onRunSelected) && (
          <Button
            onClick={handleRunClick}
            variant={runButtonVariant === "default" ? "default" : "outline"}
            className={runButtonClassName}
          >
            <Play className="h-4 w-4" />
            {hasSelection
              ? `Run ${selectedIds.length} Selected`
              : "Run All Projects"}
          </Button>
        )}
        {!isJudgingView && hasFailedProjects && onRerunFailed && (
          <Button onClick={onRerunFailed} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Rerun Failed ({failedProjectsCount})
          </Button>
        )}
        {/* View Mode Dropdown */}
        {onJudgingViewChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 gap-2">
                {isJudgingView ? "Judging View" : "Default View"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>View Mode</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={!isJudgingView}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onJudgingViewChange(false);
                  }
                }}
                onSelect={(e) => e.preventDefault()}
              >
                Default View
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={isJudgingView}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onJudgingViewChange(true);
                  }
                }}
                onSelect={(e) => e.preventDefault()}
              >
                Judging View
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {onImport && (
          <Button
            onClick={onImport}
            variant={importVariant === "default" ? "default" : "outline"}
            className={importClassName}
          >
            {isJudgingView ? (
              <>
                <Download className="h-4 w-4" />
                Export CSV
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import CSV
              </>
            )}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[150px]">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  column.accessorFn !== undefined && column.getCanHide(),
              )
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
