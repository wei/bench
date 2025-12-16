"use client";

import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import type * as React from "react";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCommonPinningStyles } from "@/lib/data-table";

interface DataTableProps<TData> {
  table: TanstackTable<TData>;
  children?: React.ReactNode;
}

export function DataTable<TData>({ table, children }: DataTableProps<TData>) {
  return (
    <div className="data-table-container space-y-4 relative">
      {children}
      <div className="rounded-md border relative">
        <div className="relative w-full">
          <table className="w-full caption-bottom text-sm">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const pinningStyles = getCommonPinningStyles(
                      header.column,
                      table,
                    );
                    return (
                      <TableHead
                        key={header.id}
                        style={{
                          ...pinningStyles,
                          position: "sticky",
                          zIndex: (Number(pinningStyles.zIndex) || 0) + 10,
                        }}
                        className="h-12 sticky top-0 bg-background shadow-sm"
                        scope="col"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const project = row.original as { status?: string };
                  const hasError =
                    project.status === "errored" ||
                    project.status?.startsWith("invalid");
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      aria-selected={row.getIsSelected()}
                      className={hasError ? "bg-red-50 dark:bg-red-950/20" : ""}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const pinningStyles = getCommonPinningStyles(
                          cell.column,
                          table,
                        );
                        return (
                          <TableCell key={cell.id} style={pinningStyles}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={table.getAllColumns().length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </table>
        </div>
      </div>
    </div>
  );
}
