"use client";

import type { Table as TanstackTable } from "@tanstack/react-table";
import { Play, Search, Upload, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface DataTableToolbarProps<TData> {
  table: TanstackTable<TData>;
  onRunAll?: () => void;
  onRunSelected?: (selectedIds: string[]) => void;
  onImport?: () => void;
  allProcessed?: boolean;
  hasNoProjects?: boolean;
}

export function DataTableToolbar<TData>({
  table,
  onRunAll,
  onRunSelected,
  onImport,
  allProcessed = false,
  hasNoProjects = false,
}: DataTableToolbarProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map(
    (row) => (row.original as { id: string }).id,
  );
  const hasSelection = selectedIds.length > 0;
  const isFiltered = table.getState().columnFilters.length > 0;
  const [globalFilter, setGlobalFilter] = React.useState("");

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      table.setGlobalFilter(globalFilter);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [globalFilter, table]);

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
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-10 pl-10 w-full lg:w-[400px]"
          />
        </div>
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              setGlobalFilter("");
            }}
            className="h-10 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {(onRunAll || onRunSelected) && (
          <Button
            onClick={handleRunClick}
            variant={runButtonVariant as "default" | "outline"}
            className={runButtonClassName}
          >
            <Play className="h-4 w-4" />
            {hasSelection
              ? `Run ${selectedIds.length} Selected`
              : "Run All Projects"}
          </Button>
        )}
        {onImport && (
          <Button
            onClick={onImport}
            variant={importVariant as "default" | "outline"}
            className={importClassName}
          >
            <Upload className="h-4 w-4" />
            Import CSV
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
                  typeof column.accessorFn !== "undefined" &&
                  column.getCanHide(),
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
