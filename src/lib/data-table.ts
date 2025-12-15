import type { Table } from "@tanstack/react-table";

export function getCommonPinningStyles<TData>(
  column: { getIsPinned: () => boolean; getPinnedIndex: () => number },
  table: Table<TData>,
) {
  const isPinned = column.getIsPinned();
  const pinnedIndex = column.getPinnedIndex();
  const isLastLeftPinnedColumn =
    isPinned === "left" && table.getLeftLeafColumns().length - 1 === pinnedIndex;
  const isFirstRightPinnedColumn =
    isPinned === "right" && pinnedIndex === 0;

  return {
    left: isPinned === "left" ? `${pinnedIndex * 40}px` : undefined,
    right: isPinned === "right" ? `${pinnedIndex * 40}px` : undefined,
    position: isPinned ? "sticky" : "relative",
    zIndex: isPinned ? 2 : 0,
    boxShadow: isLastLeftPinnedColumn
      ? "-4px 0 4px -4px hsl(var(--border)) inset"
      : isFirstRightPinnedColumn
        ? "4px 0 4px -4px hsl(var(--border)) inset"
        : undefined,
  };
}

export const dataTableConfig = {
  pageSizeOptions: [10, 20, 30, 50, 100],
  defaultPageSize: 20,
};

