"use client";

import { useState } from "react";
import Image from "next/image";
import { Calendar, CalendarRange, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useStore, type Event } from "@/lib/store";
import { cn } from "@/lib/utils";

interface SidebarProps {
  readonly onEventSelect: (eventId: string | null) => void;
}

export function Sidebar({ onEventSelect }: SidebarProps) {
  const { events, projects, selectedEventId } = useStore();

  // check if event is currently active
  const isEventActive = (startsAt: string | null, endsAt: string | null) => {
    if (!startsAt || !endsAt) return false;
    const now = new Date();
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    return now >= start && now <= end;
  };

  // get project count for event
  const getProjectCount = (eventId: string) => {
    return projects.filter((p) => p.event_id === eventId).length;
  };

  // calculate event duration in days
  const getEventDuration = (startsAt: string | null, endsAt: string | null) => {
    if (!startsAt || !endsAt) return 0;
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // format date range
  const formatDateRange = (startsAt: string | null, endsAt: string | null) => {
    if (!startsAt || !endsAt) return "TBD";
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    const startDay = start.getDate();
    const endDay = end.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  };

  return (
    <aside className="w-64 bg-white dark:bg-[#262626] border-r border-gray-200 dark:border-[#404040] flex flex-col">
      <div className="h-16 px-6 border-b border-gray-200 dark:border-[#404040] flex items-center">
        <h1 className="text-2xl font-bold text-(--mlh-dark-grey) dark:text-(--mlh-white) font-headline">
          Bench
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          <h2 className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            My Events
          </h2>

          {events
            .sort((a, b) => {
              // Sort by start date (soonest first)
              // Events without dates go to the end
              if (!a.starts_at && !b.starts_at) return 0;
              if (!a.starts_at) return 1;
              if (!b.starts_at) return -1;
              return (
                new Date(a.starts_at).getTime() -
                new Date(b.starts_at).getTime()
              );
            })
            .map((event) => {
            const projectCount = getProjectCount(event.id);
            const isActive = isEventActive(event.starts_at, event.ends_at);
            const isSelected = selectedEventId === event.id;
            const duration = getEventDuration(event.starts_at, event.ends_at);
            const dateRange = formatDateRange(event.starts_at, event.ends_at);

            return (
              <SidebarEventItem
                key={event.id}
                event={event}
                projectCount={projectCount}
                isActive={isActive}
                isSelected={isSelected}
                duration={duration}
                dateRange={dateRange}
                onEventSelect={onEventSelect}
              />
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-[#404040]">
        <button
          type="button"
          onClick={() => onEventSelect(null)}
          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors text-sm"
        >
          View All Events
        </button>
      </div>
    </aside>
  );
}

interface SidebarEventItemProps {
  readonly event: Event;
  readonly projectCount: number;
  readonly isActive: boolean;
  readonly isSelected: boolean;
  readonly duration: number;
  readonly dateRange: string;
  readonly onEventSelect: (eventId: string) => void;
}

function SidebarEventItem({
  event,
  projectCount,
  isActive,
  isSelected,
  duration,
  dateRange,
  onEventSelect,
}: SidebarEventItemProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onEventSelect(event.id)}
      className={cn(
        "w-full text-left px-3 py-3 rounded-lg transition-colors cursor-pointer",
        "hover:bg-gray-50 dark:hover:bg-[#404040]",
        isSelected && "bg-(--mlh-blue) text-white hover:bg-(--mlh-blue)/90",
      )}
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          {event.logo_url && !imageError ? (
            <Image
              src={event.logo_url}
              alt={event.name}
              width={40}
              height={40}
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <ImageOff className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm truncate">
              {event.name}
            </span>
            {isActive && (
              <div className="w-2 h-2 rounded-full bg-(--mlh-teal) animate-pulse shrink-0 ml-2" />
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              {duration === 2 ? (
                <Calendar className="w-3 h-3" />
              ) : (
                <CalendarRange className="w-3 h-3" />
              )}
              <span
                className={cn(
                  "opacity-70",
                  isSelected && "opacity-90",
                )}
              >
                {dateRange}
              </span>
            </div>

            {projectCount > 0 && (
              <Badge
                variant="secondary"
                className={cn(
                  "ml-auto text-xs h-5",
                  isSelected &&
                    "bg-white/20 text-white hover:bg-white/30",
                )}
              >
                {projectCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
