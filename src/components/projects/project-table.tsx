"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Play, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Project } from "@/lib/store";
import { createColumns } from "./project-table-columns";

interface ProjectTableProps {
  readonly projects: Project[];
  readonly onRunAnalysis: (projectId: string) => void;
  readonly onBatchRun: (projectIds: string[]) => void;
  readonly onImport: () => void;
  readonly onProjectClick: (project: Project) => void;
}

export function ProjectTable({
  projects,
  onRunAnalysis,
  onBatchRun,
  onImport,
  onProjectClick,
}: ProjectTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(
    () => createColumns(onProjectClick, onRunAnalysis),
    [onProjectClick, onRunAnalysis],
  );

  const table = useReactTable({
    data: projects,
    columns,
    state: {
      sorting,
      rowSelection,
      globalFilter,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);

  const handleRunAll = () => {
    const allIds = projects.map((p) => p.id);
    onBatchRun(allIds);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search projects..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Button onClick={handleRunAll} className="gap-2">
            <Play className="w-4 h-4" />
            Run All Projects
          </Button>
          {selectedIds.length > 0 && (
            <Button
              onClick={() => onBatchRun(selectedIds)}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              Run {selectedIds.length} Selected
            </Button>
          )}
          <Button
            onClick={onImport}
            variant="outline"
            className="gap-2 bg-transparent"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No projects found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
