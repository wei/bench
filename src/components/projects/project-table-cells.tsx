import type { Table as ReactTable, Row } from "@tanstack/react-table";
import { ExternalLink, Github, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getComplexityColor,
  getDevpostUrl,
  getPrizeTracks,
  getStatusColor,
} from "@/lib/project-utils";
import type { Project, ProjectProcessingStatus } from "@/lib/store";

export function SelectHeader({
  table,
}: {
  readonly table: ReactTable<Project>;
}) {
  return (
    <input
      type="checkbox"
      checked={table.getIsAllRowsSelected()}
      onChange={table.getToggleAllRowsSelectedHandler()}
      className="cursor-pointer"
    />
  );
}

export function SelectCell({ row }: { readonly row: Row<Project> }) {
  return (
    <input
      type="checkbox"
      checked={row.getIsSelected()}
      onChange={row.getToggleSelectedHandler()}
      className="cursor-pointer"
    />
  );
}

export function StatusCell({
  status,
}: {
  readonly status: ProjectProcessingStatus;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
      <span className="text-xs text-muted-foreground">
        {status.replaceAll("_", " ").replaceAll(":", " - ")}
      </span>
    </div>
  );
}

export function ProjectTitleCell({
  project,
  onProjectClick,
}: {
  readonly project: Project;
  readonly onProjectClick: (project: Project) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onProjectClick(project)}
      className="text-left hover:text-(--mlh-red) transition-colors font-medium"
    >
      {project.project_title}
    </button>
  );
}

export function LinksCell({ project }: { readonly project: Project }) {
  const devpostUrl = getDevpostUrl(project);
  return (
    <div className="flex gap-2">
      {project.github_url && (
        <a
          href={project.github_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-(--mlh-dark-grey)"
        >
          <Github className="w-4 h-4" />
        </a>
      )}
      {devpostUrl && (
        <a
          href={devpostUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-(--mlh-dark-grey)"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

export function ComplexityCell({
  complexity,
}: {
  readonly complexity: string | null;
}) {
  return (
    <Badge className={getComplexityColor(complexity)}>
      {complexity || "N/A"}
    </Badge>
  );
}

export function PrizeTracksCell({ project }: { readonly project: Project }) {
  const prizeTracks = getPrizeTracks(project);
  return (
    <div className="flex flex-wrap gap-1 max-w-[250px]">
      {prizeTracks.length > 0 ? (
        prizeTracks.map((track) => (
          <Badge
            key={track}
            variant="outline"
            className="text-xs border-(--mlh-yellow) text-(--mlh-dark-grey)"
          >
            {track}
          </Badge>
        ))
      ) : (
        <span className="text-xs text-muted-foreground">None selected</span>
      )}
    </div>
  );
}

export function TechStackCell({ techStack }: { readonly techStack: string[] }) {
  return (
    <div className="flex flex-wrap gap-1 max-w-[250px]">
      {techStack.length > 0 ? (
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
        <span className="text-xs text-muted-foreground">Not analyzed</span>
      )}
    </div>
  );
}

export function ActionsCell({
  project,
  onRunAnalysis,
}: {
  readonly project: Project;
  readonly onRunAnalysis: (projectId: string) => void;
}) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => onRunAnalysis(project.id)}
      disabled={project.status.startsWith("processing")}
      className="gap-2"
    >
      <Play className="w-3 h-3" />
      {project.status === "processed" ? "Re-run" : "Analyze"}
    </Button>
  );
}
