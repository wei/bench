import type { ColumnDef } from "@tanstack/react-table";
import type { Project } from "@/lib/store";
import {
  ActionsCell,
  ComplexityCell,
  LinksCell,
  PrizeTracksCell,
  ProjectTitleCell,
  SelectCell,
  SelectHeader,
  StatusCell,
  TechStackCell,
} from "./project-table-cells";

export function createColumns(
  onProjectClick: (project: Project) => void,
  onRunAnalysis: (projectId: string) => void,
): ColumnDef<Project>[] {
  return [
    {
      id: "select",
      header: ({ table }) => <SelectHeader table={table} />,
      cell: ({ row }) => <SelectCell row={row} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusCell status={row.original.status} />,
    },
    {
      accessorKey: "project_title",
      header: "Project",
      cell: ({ row }) => (
        <ProjectTitleCell
          project={row.original}
          onProjectClick={onProjectClick}
        />
      ),
    },
    {
      id: "links",
      header: "Links",
      cell: ({ row }) => <LinksCell project={row.original} />,
    },
    {
      accessorKey: "technical_complexity",
      header: "Complexity",
      cell: ({ row }) => (
        <ComplexityCell complexity={row.original.technical_complexity} />
      ),
    },
    {
      accessorKey: "prize_tracks",
      header: "Prize Tracks",
      cell: ({ row }) => <PrizeTracksCell project={row.original} />,
    },
    {
      accessorKey: "tech_stack",
      header: "Tech Stack",
      cell: ({ row }) => <TechStackCell techStack={row.original.tech_stack} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <ActionsCell project={row.original} onRunAnalysis={onRunAnalysis} />
      ),
    },
  ];
}
