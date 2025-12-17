"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronUp,
  Loader2,
  Minus,
  Octagon,
  Play,
  Star,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDataTable } from "@/hooks/use-data-table";
import { usePrizeCategories } from "@/hooks/use-prize-categories";
import { exportProjectsToCSV } from "@/lib/csv-export";
import {
  type FilterState,
  loadFilterState,
  saveFilterState,
} from "@/lib/filter-persistence";
import {
  getPrizeStatusDisplay,
  getPrizeTracks,
  getStatusLabel,
  getStatusTooltipMessage,
  parsePrizeResults,
} from "@/lib/project-utils";
import type { Project, ProjectProcessingStatus } from "@/lib/store";
import { useStore } from "@/lib/store";
import { toTitleCase } from "@/lib/utils/string-utils";

// Shared debounce timers ref (module-level to persist across renders)
// Key format: `${projectId}:${type}` to support both rating and notes for the same project
const debounceTimersRef = new Map<
  string,
  { timer: NodeJS.Timeout; type: "rating" | "notes" }
>();

// Component for judging score cell with debounced save
function JudgingScoreCell({ project }: { readonly project: Project }) {
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
    const timerKey = `${project.id}:rating`;
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
    const timerKey = `${project.id}:rating`;
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
      className="h-8 w-20 text-sm"
      placeholder="—"
      min={0}
      max={10}
      step={1}
    />
  );
}

// Component for notes cell with debounced save
function NotesCell({ project }: { readonly project: Project }) {
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
    const timerKey = `${project.id}:notes`;
    return () => {
      const existing = debounceTimersRef.get(timerKey);
      if (existing?.type === "notes") {
        clearTimeout(existing.timer);
        debounceTimersRef.delete(timerKey);
      }
    };
  }, [project.id]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Clear existing timer using unique key
    const timerKey = `${project.id}:notes`;
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
    <Textarea
      value={localValue}
      onChange={handleChange}
      className="w-full min-h-8 max-h-32 text-sm resize-none max-w-[300px]"
      placeholder="Add notes..."
      rows={1}
      style={{
        height: "auto",
        minHeight: "2rem",
      }}
      onInput={(e) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = "auto";
        target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
      }}
    />
  );
}

interface ProjectTableProps {
  readonly projects: Project[];
  readonly onRunAnalysis: (projectId: string) => void;
  readonly onBatchRun: (projectIds: string[]) => void;
  readonly onImport: () => void;
  readonly onProjectClick: (project: Project) => void;
  readonly onJudgingViewChange?: (isJudgingView: boolean) => void;
  readonly eventId?: string | null;
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
// Note: For reruns, we explicitly EXCLUDE projects that are invalid because
// they fall outside the event window or have no GitHub repository.
function isFailedOrInvalidOrErrored(status: ProjectProcessingStatus): boolean {
  if (status === "errored") return true;

  if (!status.startsWith("invalid:")) return false;

  // Exclude these invalid types from "rerun failed" flows:
  // - invalid:github_inaccessible (no GitHub repository / inaccessible)
  // - invalid:rule_violation (e.g. commits outside event window)
  if (
    status === "invalid:github_inaccessible" ||
    status === "invalid:rule_violation"
  ) {
    return false;
  }

  // Any other invalid status (if added in the future) is treated as rerunnable
  return true;
}

export function ProjectTable({
  projects,
  onRunAnalysis,
  onBatchRun,
  onImport,
  onProjectClick,
  onJudgingViewChange,
  eventId,
}: ProjectTableProps) {
  const { favoriteProjects, toggleFavoriteProject } = useStore();

  // Load persisted filter state when eventId changes
  const persistedState = React.useMemo(() => {
    return loadFilterState(eventId ?? null);
  }, [eventId]);

  // Whether we actually have any persisted filters for the current event
  const hasPersistedState = React.useMemo(
    () => Object.keys(persistedState ?? {}).length > 0,
    [persistedState],
  );

  const [title, setTitle] = useQueryState("title", parseAsString);
  const [isJudgingView, setIsJudgingView] = React.useState(
    persistedState.isJudgingView ?? false,
  );

  // Notify parent when judging view changes
  React.useEffect(() => {
    onJudgingViewChange?.(isJudgingView);
  }, [isJudgingView, onJudgingViewChange]);

  const [status, setStatus] = useQueryState(
    "status",
    parseAsArrayOf(parseAsString),
  );
  const [complexity, setComplexity] = useQueryState(
    "complexity",
    parseAsArrayOf(parseAsString),
  );
  const [prizeTrack, setPrizeTrack] = useQueryState(
    "prizeTrack",
    parseAsString,
  );
  const [techStack, setTechStack] = useQueryState(
    "techStack",
    parseAsArrayOf(parseAsString),
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

  // Check if URL has filter params - reactive to actual query state values
  const hasUrlParams = React.useMemo(() => {
    return !!(
      title ||
      (status && status.length > 0) ||
      (complexity && complexity.length > 0) ||
      prizeTrack ||
      (techStack && techStack.length > 0) ||
      hasGithub
    );
  }, [title, status, complexity, prizeTrack, techStack, hasGithub]);

  // Track the last eventId we restored for and if we're currently restoring
  const lastRestoredEventIdRef = React.useRef<string | null | undefined>(null);
  const isRestoringRef = React.useRef(false);
  const isInitialMountRef = React.useRef(true);
  const hasInitializedRef = React.useRef(false);

  // Restore persisted state when eventId changes and URL has no params
  React.useEffect(() => {
    // Only restore if eventId changed and we haven't restored yet for this eventId
    if (
      eventId !== lastRestoredEventIdRef.current &&
      persistedState &&
      !hasUrlParams
    ) {
      lastRestoredEventIdRef.current = eventId;
      isRestoringRef.current = true;

      // Restore all filter states from persisted state
      if (persistedState.title) {
        setTitle(persistedState.title);
      }
      if (persistedState.status && persistedState.status.length > 0) {
        setStatus(persistedState.status);
      }
      if (persistedState.complexity && persistedState.complexity.length > 0) {
        setComplexity(persistedState.complexity);
      }
      if (persistedState.prizeTrack) {
        setPrizeTrack(persistedState.prizeTrack);
      }
      if (persistedState.techStack && persistedState.techStack.length > 0) {
        setTechStack(persistedState.techStack);
      }
      if (persistedState.techStackMode) {
        setTechStackMode(persistedState.techStackMode);
      }
      if (persistedState.hasGithub) {
        setHasGithub(persistedState.hasGithub);
      }
      if (persistedState.isJudgingView !== undefined) {
        setIsJudgingView(persistedState.isJudgingView);
      }

      // Mark restoration as complete after a brief delay to allow state updates
      setTimeout(() => {
        isRestoringRef.current = false;
        hasInitializedRef.current = true;
      }, 150);
    } else if (eventId !== lastRestoredEventIdRef.current) {
      // Reset restore flag when eventId changes
      isRestoringRef.current = false;
      lastRestoredEventIdRef.current = eventId;
      // If we have URL params, mark as initialized immediately
      if (hasUrlParams) {
        hasInitializedRef.current = true;
      }
    }

    // Mark initial mount as complete after first render
    if (isInitialMountRef.current) {
      setTimeout(() => {
        isInitialMountRef.current = false;
        // If no restoration happened and no URL params, mark as initialized
        if (!hasPersistedState || !eventId || hasUrlParams) {
          hasInitializedRef.current = true;
        }
      }, 300);
    }
  }, [
    eventId,
    persistedState,
    hasPersistedState,
    hasUrlParams,
    setTitle,
    setStatus,
    setComplexity,
    setPrizeTrack,
    setTechStack,
    setTechStackMode,
    setHasGithub,
  ]);
  const { prizeCategoryMap, prizeCategoryNameMap, prizeCategories } =
    usePrizeCategories();

  // Get unique tech stack values from all projects
  // Deduplicate case-insensitively, preferring capitalized versions
  const uniqueTechStack = React.useMemo(() => {
    const techMap = new Map<string, string>(); // lowercase -> preferred version
    projects.forEach((project) => {
      project.tech_stack?.forEach((tech: string) => {
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
      // In judging view, only show favorited projects
      if (isJudgingView && !favoriteProjects.includes(project.id)) {
        return false;
      }

      const matchesTitle =
        !title ||
        title === "" ||
        project.project_title?.toLowerCase().includes(title.toLowerCase());
      const matchesStatus =
        !status || status.length === 0 || status.includes(project.status);
      const matchesComplexity =
        !complexity ||
        complexity.length === 0 ||
        (project.technical_complexity &&
          complexity.includes(project.technical_complexity));

      // Prize track filter (single selection)
      const matchesPrizeTrack =
        !prizeTrack || getPrizeTracks(project).includes(prizeTrack);

      // Tech stack filter (intersection or union, case-insensitive)
      const matchesTechStack =
        !techStack ||
        techStack.length === 0 ||
        (project.tech_stack &&
          project.tech_stack.length > 0 &&
          (techStackMode === "intersection"
            ? techStack.every((filterTech) =>
                project.tech_stack.some(
                  (projectTech: string) =>
                    projectTech.toLowerCase() === filterTech.toLowerCase(),
                ),
              )
            : techStack.some((filterTech) =>
                project.tech_stack.some(
                  (projectTech: string) =>
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
    isJudgingView,
    favoriteProjects,
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

    const cols: ColumnDef<Project>[] = [
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
        id: "judging_score",
        accessorKey: "judging_rating",
        header: ({ column }: { column: Column<Project, unknown> }) => (
          <DataTableColumnHeader column={column} label="Score" />
        ),
        cell: ({ row }) => <JudgingScoreCell project={row.original} />,
        enableSorting: true,
        size: 100,
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }: { column: Column<Project, unknown> }) => (
          <DataTableColumnHeader column={column} label="Status" />
        ),
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue(columnId) as string;
          const b = rowB.getValue(columnId) as string;
          // Custom order: processed (green) -> processing (blue) -> invalid (amber) -> errored (red) -> unprocessed (gray)
          const order: Record<string, number> = {
            processed: 5,
            "processing:code_review": 4,
            "processing:prize_category_review": 4,
            "invalid:github_inaccessible": 3,
            "invalid:rule_violation": 3,
            errored: 2,
            unprocessed: 1,
          };
          const aVal = a.startsWith("processing:")
            ? order["processing:code_review"]
            : (order[a] ?? 0);
          const bVal = b.startsWith("processing:")
            ? order["processing:code_review"]
            : (order[b] ?? 0);
          const aInvalid = a.startsWith("invalid:")
            ? order["invalid:github_inaccessible"]
            : aVal;
          const bInvalid = b.startsWith("invalid:")
            ? order["invalid:github_inaccessible"]
            : bVal;
          return bInvalid - aInvalid; // Descending: processed -> processing -> invalid -> errored -> unprocessed
        },
        cell: ({ cell, row }) => {
          const status = cell.getValue<ProjectProcessingStatus>();
          const tooltipMessage =
            status === "processed"
              ? undefined
              : getStatusTooltipMessage(row.original);
          const tooltipTitle =
            status === "processed" ? undefined : getStatusLabel(status);

          let icon: React.ReactNode;
          if (status === "processed") {
            icon = (
              <CheckCircle2
                className={`text-green-600 dark:text-green-400 h-5! w-5!`}
              />
            );
          } else if (status.startsWith("processing:")) {
            icon = (
              <Loader2
                className={`text-blue-600 dark:text-blue-400 animate-spin h-5! w-5!`}
              />
            );
          } else if (status.startsWith("invalid:")) {
            icon = (
              <AlertTriangle
                className={`text-amber-600 dark:text-amber-400 h-5! w-5!`}
              />
            );
          } else if (status === "errored") {
            icon = (
              <Octagon className={`text-red-600 dark:text-red-400 h-5! w-5!`} />
            );
          } else {
            // unprocessed
            icon = (
              <Minus className={`text-gray-500 dark:text-gray-400 h-5! w-5!`} />
            );
          }

          const iconWrapper = (
            <div className="flex items-center justify-center w-5 h-5">
              {icon}
            </div>
          );

          if (status === "processed") {
            return iconWrapper;
          }

          return (
            <StatusBadge
              kind="project"
              status={status}
              tooltipTitle={tooltipTitle}
              tooltip={tooltipMessage}
              showInfoIcon={false}
              noRounded
              className="border-0 bg-transparent p-0 flex items-center justify-center"
            >
              {icon}
            </StatusBadge>
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
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue(columnId) as string | null;
          const b = rowB.getValue(columnId) as string | null;
          // Custom order: advanced -> intermediate -> beginner -> invalid -> N/A
          const order: Record<string, number> = {
            advanced: 5,
            intermediate: 4,
            beginner: 3,
            invalid: 2,
          };
          const aVal = a ? (order[a] ?? 1) : 1; // N/A gets 1
          const bVal = b ? (order[b] ?? 1) : 1; // N/A gets 1
          return bVal - aVal; // Descending: advanced -> intermediate -> beginner -> invalid -> N/A
        },
        cell: ({ cell, row }) => {
          const complexity = cell.getValue<string | null>();
          const project = row.original;

          if (!complexity) {
            return <span className="text-xs text-muted-foreground">N/A</span>;
          }

          // Show N/A instead of "invalid" for display
          if (complexity === "invalid") {
            return <span className="text-xs text-muted-foreground">N/A</span>;
          }

          const text = toTitleCase(complexity);
          const tooltipMessage =
            project.technical_complexity_message || undefined;

          if (complexity === "advanced") {
            return (
              <StatusBadge
                kind="project"
                status={complexity as ProjectProcessingStatus}
                tooltip={tooltipMessage}
                tooltipTitle={text}
                noUnderline
                className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center gap-1"
              >
                <ChevronUp className="w-3 h-3" />
                {text}
              </StatusBadge>
            );
          }

          if (tooltipMessage) {
            return (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs cursor-help">{text}</span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-72">
                    <p>{tooltipMessage}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return <span className="text-xs">{text}</span>;
        },
        meta: {
          label: "Complexity",
          variant: "multiSelect" as const,
          options: complexityOptions,
        },
        enableColumnFilter: true,
      },
      {
        id: "description_accuracy",
        accessorKey: "description_accuracy_level",
        header: ({ column }: { column: Column<Project, unknown> }) => (
          <DataTableColumnHeader column={column} label="Desc. Acc." />
        ),
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue(columnId) as string | null;
          const b = rowB.getValue(columnId) as string | null;
          // Custom order: high -> medium -> low -> N/A
          const order: Record<string, number> = {
            high: 4,
            medium: 3,
            low: 2,
          };
          const aVal = a ? (order[a] ?? 1) : 1; // N/A gets 1
          const bVal = b ? (order[b] ?? 1) : 1; // N/A gets 1
          return bVal - aVal; // Descending: high -> medium -> low -> N/A
        },
        cell: ({ cell, row }) => {
          const accuracy = cell.getValue<string | null>();
          const project = row.original;

          if (!accuracy) {
            return <span className="text-xs text-muted-foreground">N/A</span>;
          }

          const text = toTitleCase(accuracy);
          const tooltipMessage =
            project.description_accuracy_message || undefined;

          if (accuracy === "high") {
            return (
              <StatusBadge
                kind="project"
                status={accuracy as ProjectProcessingStatus}
                tooltip={tooltipMessage}
                tooltipTitle={text}
                noUnderline
                className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center gap-1 text-xs"
              >
                <ChevronUp className="w-3 h-3" />
                {text}
              </StatusBadge>
            );
          }

          if (tooltipMessage) {
            return (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs cursor-help">{text}</span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-72">
                    <p>{tooltipMessage}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return <span className="text-xs">{text}</span>;
        },
        enableColumnFilter: true,
        size: 120,
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
                prizeTracks
                  .map((trackSlug) => {
                    const result = results[trackSlug];
                    const shortDisplayName = getPrizeDisplayName(trackSlug); // short_name or name fallback
                    const fullName =
                      prizeCategoryNameMap.get(trackSlug) || trackSlug; // full name for tooltip
                    const { status, message } = getPrizeStatusDisplay(result);

                    return {
                      trackSlug,
                      shortDisplayName,
                      fullName,
                      status,
                      message,
                    };
                  })
                  .sort((a, b) => {
                    // Sort order: valid (5) -> invalid (4) -> processing (3) -> unprocessed (2) -> errored (1)
                    const order: Record<string, number> = {
                      valid: 5,
                      invalid: 4,
                      processing: 3,
                      unprocessed: 2,
                      errored: 1,
                    };
                    return (order[b.status] ?? 0) - (order[a.status] ?? 0);
                  })
                  .map(
                    ({
                      trackSlug,
                      shortDisplayName,
                      fullName,
                      status,
                      message,
                    }) => (
                      <StatusBadge
                        key={trackSlug}
                        kind="prize"
                        status={status}
                        tooltipTitle={fullName}
                        tooltip={message}
                        noUnderline
                        className="text-xs flex items-center gap-1"
                      >
                        {status === "valid" && "✓ "}
                        {status === "invalid" && "? "}
                        {shortDisplayName}
                      </StatusBadge>
                    ),
                  )
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
        id: "notes",
        accessorKey: "judging_notes",
        header: "Notes",
        cell: ({ row }) => <NotesCell project={row.original} />,
        enableSorting: false,
        size: 200,
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
    return cols;
  }, [
    onProjectClick,
    onRunAnalysis,
    favoriteProjects,
    handleToggleFavorite,
    prizeCategoryMap,
    prizeCategoryNameMap,
  ]);

  // Merge persisted column visibility with default visibility
  const initialColumnVisibility = React.useMemo(() => {
    const defaultVisibility: Record<string, boolean> = {
      judging_score: isJudgingView,
      notes: isJudgingView,
      status: !isJudgingView,
      actions: !isJudgingView,
    };

    // Merge with persisted visibility, but respect judging view defaults
    if (persistedState.columnVisibility) {
      return {
        ...defaultVisibility,
        ...persistedState.columnVisibility,
        // Always respect judging view defaults for these columns
        judging_score: isJudgingView,
        notes: isJudgingView,
        status: !isJudgingView,
        actions: !isJudgingView,
      };
    }

    return defaultVisibility;
  }, [isJudgingView, persistedState.columnVisibility]);

  const { table, sorting } = useDataTable({
    data: filteredData,
    columns,
    initialState: {
      // Use persisted sorting if available so sort direction is restored per event
      sorting:
        persistedState.sorting?.map((sort) => ({
          id: sort.id,
          desc: !!sort.desc,
        })) ?? [],
      columnPinning: {
        left: ["select", "favorite"],
        right: isJudgingView ? ["notes"] : ["actions", "notes"],
      },
      columnVisibility: initialColumnVisibility,
    },
    getRowId: (row) => row.id,
  });

  // Update column visibility when judging view changes
  React.useEffect(() => {
    table.getColumn("status")?.toggleVisibility(!isJudgingView);
    table.getColumn("actions")?.toggleVisibility(!isJudgingView);
    table.getColumn("judging_score")?.toggleVisibility(isJudgingView);
    table.getColumn("notes")?.toggleVisibility(isJudgingView);
  }, [isJudgingView, table]);

  // Track the last eventId we restored column visibility for
  const lastRestoredColumnVisibilityEventIdRef = React.useRef<
    string | null | undefined
  >(null);
  // Track the last eventId we restored sorting for
  const lastRestoredSortingEventIdRef = React.useRef<string | null | undefined>(
    null,
  );

  // Restore column visibility from persisted state when eventId changes
  React.useEffect(() => {
    if (
      eventId !== lastRestoredColumnVisibilityEventIdRef.current &&
      persistedState.columnVisibility &&
      table
    ) {
      lastRestoredColumnVisibilityEventIdRef.current = eventId;
      Object.entries(persistedState.columnVisibility).forEach(
        ([columnId, isVisible]) => {
          // Don't override judging view defaults for these columns
          if (
            columnId !== "judging_score" &&
            columnId !== "notes" &&
            columnId !== "status" &&
            columnId !== "actions"
          ) {
            table.getColumn(columnId)?.toggleVisibility(isVisible);
          }
        },
      );
    }
  }, [eventId, persistedState.columnVisibility, table]);

  // Restore sorting from persisted state when eventId changes
  React.useEffect(() => {
    if (
      eventId !== lastRestoredSortingEventIdRef.current &&
      persistedState.sorting &&
      table
    ) {
      lastRestoredSortingEventIdRef.current = eventId;
      // Apply the persisted sorting state to the table
      table.setSorting(
        persistedState.sorting.map((sort) => ({
          id: sort.id,
          desc: !!sort.desc,
        })),
      );
    }
  }, [eventId, persistedState.sorting, table]);

  // Save filter state to sessionStorage whenever filters change
  // Skip saving during initial restore to prevent overwriting with empty values
  React.useEffect(() => {
    if (!eventId) return;
    // Don't save if we're currently restoring, on initial mount, or haven't initialized yet
    if (
      isRestoringRef.current ||
      isInitialMountRef.current ||
      !hasInitializedRef.current
    ) {
      return;
    }

    const filterState: FilterState = {
      title: title || undefined,
      status: status && status.length > 0 ? status : undefined,
      complexity: complexity && complexity.length > 0 ? complexity : undefined,
      prizeTrack: prizeTrack || undefined,
      techStack: techStack && techStack.length > 0 ? techStack : undefined,
      techStackMode,
      hasGithub: hasGithub ?? undefined,
      isJudgingView,
      columnVisibility: table.getState().columnVisibility,
      sorting,
    };

    saveFilterState(eventId, filterState);
  }, [
    eventId,
    title,
    status,
    complexity,
    prizeTrack,
    techStack,
    techStackMode,
    hasGithub,
    isJudgingView,
    sorting,
    table,
  ]);

  const handleExportCSV = React.useCallback(() => {
    exportProjectsToCSV(filteredData);
  }, [filteredData]);

  const handleRunAll = () => {
    // Run all projects that:
    // - Have at least one prize track
    // - Are NOT invalid because they fall outside the event window
    //   or because they don't have a GitHub repository
    const allIds = filteredData
      .filter((p) => {
        const hasPrizeTracks = getPrizeTracks(p).length > 0;
        const isExcludedInvalidStatus =
          p.status === "invalid:github_inaccessible" ||
          p.status === "invalid:rule_violation";

        return hasPrizeTracks && !isExcludedInvalidStatus;
      })
      .map((p) => p.id);

    if (allIds.length > 0) {
      onBatchRun(allIds);
    }
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

  // Check if we're in judging view with no results
  const isJudgingViewWithNoResults = isJudgingView && filteredData.length === 0;
  const emptyStateMessage = isJudgingViewWithNoResults
    ? "No results found. Favorite a project by clicking the star icon for it to appear in judging view."
    : undefined;

  return (
    <div className="space-y-4 relative">
      <DataTable table={table} emptyStateMessage={emptyStateMessage}>
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
            onRunAll={isJudgingView ? undefined : handleRunAll}
            onRunSelected={isJudgingView ? undefined : (ids) => onBatchRun(ids)}
            onRerunFailed={isJudgingView ? undefined : handleRerunFailed}
            onImport={isJudgingView ? handleExportCSV : onImport}
            isJudgingView={isJudgingView}
            onJudgingViewChange={setIsJudgingView}
            allProcessed={allProcessed}
            hasNoProjects={hasNoProjects}
            hasFailedProjects={hasFailedProjects}
            failedProjectsCount={failedInvalidErroredProjects.length}
            status={status ?? []}
            onStatusChange={setStatus}
            complexity={complexity ?? []}
            onComplexityChange={setComplexity}
            prizeTrack={prizeTrack ?? null}
            onPrizeTrackChange={(value) => setPrizeTrack(value)}
            prizeCategories={prizeCategories}
            techStack={techStack ?? []}
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
            title={title || ""}
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
