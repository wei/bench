"use client";

import { Info } from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/project-utils";
import type { PrizeReviewResult } from "@/lib/review/prize-results";
import type { ProjectProcessingStatus } from "@/lib/store";
import { cn } from "@/lib/utils";

type SharedProps = {
  readonly tooltip?: string;
  readonly tooltipTitle?: string;
  readonly className?: string;
  readonly showInfoIcon?: boolean;
  readonly children?: React.ReactNode;
  readonly label?: string;
  readonly noUnderline?: boolean;
  readonly style?: React.CSSProperties;
  readonly noRounded?: boolean;
};

type ProjectStatusBadgeProps = SharedProps & {
  readonly kind: "project";
  readonly status: ProjectProcessingStatus;
};

type PrizeStatusBadgeProps = SharedProps & {
  readonly kind: "prize";
  readonly status: PrizeReviewResult["status"];
};

type StatusBadgeProps = ProjectStatusBadgeProps | PrizeStatusBadgeProps;

function getPrizeBadgeColor(status: PrizeReviewResult["status"]): string {
  switch (status) {
    case "valid":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    case "invalid":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
    case "processing":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 animate-pulse";
    case "errored":
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

function getDefaultLabel(props: StatusBadgeProps): string {
  if (props.kind === "project") {
    return getStatusLabel(props.status);
  }
  return props.status.charAt(0).toUpperCase() + props.status.slice(1);
}

function getColorClass(props: StatusBadgeProps): string {
  if (props.kind === "project") {
    return getStatusBadgeColor(props.status);
  }
  return getPrizeBadgeColor(props.status);
}

function shouldShowInfoIcon(props: StatusBadgeProps): boolean {
  if (props.showInfoIcon !== undefined) {
    return props.showInfoIcon;
  }
  if (props.kind === "project") {
    return (
      props.status === "errored" ||
      (typeof props.status === "string" && props.status.startsWith("invalid"))
    );
  }
  return props.status === "errored";
}

export function StatusBadge(props: StatusBadgeProps) {
  const defaultLabel = getDefaultLabel(props);
  const badgeContent = props.children ?? props.label ?? defaultLabel;
  const tooltipTitle = props.tooltipTitle ?? badgeContent ?? defaultLabel;
  const tooltipBody = props.tooltip;
  const colorClass = getColorClass(props);
  const showInfo = shouldShowInfoIcon(props);
  const hasTooltip = !!(tooltipBody || tooltipTitle);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "border-0 flex items-center gap-1",
              props.noRounded && "rounded-none!",
              hasTooltip &&
                !props.noUnderline &&
                "cursor-help underline decoration-dashed decoration-1 underline-offset-2",
              hasTooltip && props.noUnderline && "cursor-help",
              colorClass,
              props.className,
            )}
            style={props.style}
          >
            {showInfo && <Info className="w-3 h-3 shrink-0" />}
            {badgeContent}
          </Badge>
        </TooltipTrigger>
        {hasTooltip && (
          <TooltipContent className="max-w-72 text-wrap wrap-break-word">
            {tooltipTitle ? (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">{tooltipTitle}</span>
              </div>
            ) : null}
            {tooltipBody ? <p>{tooltipBody}</p> : null}
            {!tooltipTitle && !tooltipBody ? <p>{defaultLabel}</p> : null}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
