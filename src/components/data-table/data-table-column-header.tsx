"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  label: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  label,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className="h-4">{label}</div>;
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(undefined)}
      >
        <span>{label}</span>
        {column.getIsSorted() === "desc" ? (
          <ArrowDownIcon className="ml-2 h-4 w-4" />
        ) : column.getIsSorted() === "asc" ? (
          <ArrowUpIcon className="ml-2 h-4 w-4" />
        ) : (
          <ChevronsUpDownIcon className="ml-2 h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
