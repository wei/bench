import type { Column, Table } from "@tanstack/react-table";
import type React from "react";

export function getCommonPinningStyles<TData>(
  column: Column<TData, unknown>,
  table: Table<TData>,
) {
  const isPinned = column.getIsPinned();
  const pinnedIndex = column.getPinnedIndex();
  const isLeftPinned = isPinned === "left";
  const isRightPinned = isPinned === "right";
  const isLastLeftPinnedColumn =
    isLeftPinned && table.getLeftLeafColumns().length - 1 === pinnedIndex;
  const isFirstRightPinnedColumn = isRightPinned && pinnedIndex === 0;

  const pinningStyles: React.CSSProperties = {
    left: isLeftPinned ? `${pinnedIndex * 40}px` : undefined,
    right: isRightPinned ? `${pinnedIndex * 40}px` : undefined,
    position: isPinned ? "sticky" : "relative",
    zIndex: isPinned ? 2 : 0,
    boxShadow: isLastLeftPinnedColumn
      ? "-4px 0 4px -4px hsl(var(--border)) inset"
      : isFirstRightPinnedColumn
        ? "4px 0 4px -4px hsl(var(--border)) inset"
        : undefined,
  };

  return pinningStyles;
}
