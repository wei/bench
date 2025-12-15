"use client";

import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import type * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCommonPinningStyles } from "@/lib/data-table";

interface DataTableProps<TData> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  children?: React.ReactNode;
}

export function DataTable<TData>({
  table,
  actionBar,
  children,
}: DataTableProps<TData>) {
  return (
    <div className="data-table-container space-y-4">
      {actionBar}
      {children}
      <div className="rounded-md border">
        <Table>
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
                      style={pinningStyles}
                      className="h-12"
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  aria-selected={row.getIsSelected()}
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
              ))
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
        </Table>
      </div>
    </div>
  );
}
