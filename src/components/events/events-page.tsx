"use client";

import { Calendar, Folder, ImageOff, MapPin, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ImportEventsButton } from "@/components/events/import-events-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useStore } from "@/lib/store";

type EventStatus = {
  type: "upcoming" | "active" | "ended";
  label: string;
  daysUntil?: number;
};

function getEventStatus(
  startsAt: string | null,
  endsAt: string | null,
): EventStatus {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (!startsAt || !endsAt) {
    return { type: "ended", label: "Ended" };
  }

  const start = new Date(startsAt);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endsAt);
  end.setHours(0, 0, 0, 0);

  // Event is active
  if (now >= start && now <= end) {
    return { type: "active", label: "Active" };
  }

  // Event has ended
  if (now > end) {
    return { type: "ended", label: "Ended" };
  }

  // Event is upcoming
  const diffTime = start.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { type: "upcoming", label: "Today", daysUntil: 0 };
  } else if (diffDays === 1) {
    return { type: "upcoming", label: "Tomorrow", daysUntil: 1 };
  }

  return {
    type: "upcoming",
    label: `In ${diffDays} days`,
    daysUntil: diffDays,
  };
}

function EventImage({
  logoUrl,
  eventName,
}: {
  readonly logoUrl: string | null;
  readonly eventName: string;
}) {
  const [imageError, setImageError] = useState(false);

  if (!logoUrl || imageError) {
    return (
      <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <ImageOff className="w-10 h-10 text-gray-400" />
      </div>
    );
  }

  return (
    <Image
      src={logoUrl}
      alt={eventName}
      width={80}
      height={80}
      className="w-20 h-20 rounded-lg object-cover bg-gray-100 shrink-0"
      onError={() => setImageError(true)}
    />
  );
}

export function EventsPage() {
  const { events, projects } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllEvents, setShowAllEvents] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("showAllEvents");
      return stored === "true";
    }
    return false;
  });

  // Fetch events with current filter setting
  useDashboardData(null, showAllEvents);

  // Persist toggle state to localStorage
  const handleToggle = (value: boolean) => {
    setShowAllEvents(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("showAllEvents", String(value));
    }
  };

  const eventsWithStatus = events
    .filter((event) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return event.name.toLowerCase().includes(query);
    })
    .map((event) => ({
      event,
      status: getEventStatus(event.starts_at, event.ends_at),
    }));

  const compareByStartDateAsc = (
    aStartsAt: string | null,
    bStartsAt: string | null,
  ) => {
    if (!aStartsAt && !bStartsAt) return 0;
    if (!aStartsAt) return 1;
    if (!bStartsAt) return -1;
    return new Date(aStartsAt).getTime() - new Date(bStartsAt).getTime();
  };

  const currentEvents = eventsWithStatus
    .filter(({ status }) => status.type !== "ended")
    .sort((a, b) =>
      compareByStartDateAsc(a.event.starts_at, b.event.starts_at),
    );

  const pastEvents = eventsWithStatus
    .filter(({ status }) => status.type === "ended")
    .sort((a, b) =>
      compareByStartDateAsc(a.event.starts_at, b.event.starts_at),
    );

  const getProjectCount = (eventId: string) => {
    return projects.filter((p) => p.event_id === eventId).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Hackathon Events
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and review hackathon projects
          </p>
        </div>

        <div className="shrink-0 flex gap-2">
          <ButtonGroup>
            <Button
              variant="outline"
              onClick={() => handleToggle(false)}
              data-active={!showAllEvents}
              className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
            >
              My Events
            </Button>
            <Button
              variant="outline"
              onClick={() => handleToggle(true)}
              data-active={showAllEvents}
              className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
            >
              All
            </Button>
          </ButtonGroup>
          <ImportEventsButton />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {currentEvents.map(({ event, status }) => {
          const projectCount = getProjectCount(event.id);
          const href = `/events/${event.id}`;
          const isLive = status.type === "active";
          return (
            <Link key={event.id} href={href} className="block">
              <Card
                className={`cursor-pointer hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-0 outline-none overflow-hidden ${
                  isLive
                    ? "relative border border-green-500/40 hover:border-green-500/60 shadow-[0_0_0_1px_rgba(34,197,94,0.18),0_0_18px_rgba(34,197,94,0.18)] before:absolute before:inset-0 before:rounded-xl before:ring-4 before:ring-green-500/15 before:blur before:animate-pulse before:pointer-events-none"
                    : "hover:border-primary"
                }`}
              >
                <div className="flex gap-4 p-6">
                  <div className="self-center shrink-0">
                    <EventImage
                      logoUrl={event.logo_url}
                      eventName={event.name}
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-lg leading-tight line-clamp-2 min-h-[2.8125rem]">
                          {event.name}
                        </CardTitle>
                      </div>
                      {(() => {
                        const badgeVariant =
                          status.type === "active" || status.type === "upcoming"
                            ? "default"
                            : "secondary";
                        let badgeClassName = "shrink-0";
                        if (status.type === "active") {
                          badgeClassName = "bg-green-500 text-white shrink-0";
                        } else if (status.type === "upcoming") {
                          badgeClassName =
                            "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 shrink-0";
                        }
                        return (
                          <Badge
                            variant={badgeVariant}
                            className={badgeClassName}
                          >
                            {status.label}
                          </Badge>
                        );
                      })()}
                    </div>

                    {event.starts_at && event.ends_at ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">
                          {(() => {
                            const start = new Date(event.starts_at);
                            const end = new Date(event.ends_at);
                            const startMonth = start.toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                              },
                            );
                            const endMonth = end.toLocaleDateString("en-US", {
                              month: "short",
                            });
                            const startDay = start.getDate();
                            const endDay = end.getDate();
                            const year = start.getFullYear();

                            if (startMonth === endMonth) {
                              return `${startMonth} ${startDay} - ${endDay}, ${year}`;
                            }
                            return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
                          })()}
                        </span>
                        {projectCount > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                  <Folder className="w-4 h-4 shrink-0" />
                                  <span className="font-medium">
                                    {projectCount}
                                  </span>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Projects</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-gray-600">
                        {projectCount > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                  <Folder className="w-4 h-4 shrink-0" />
                                  <span className="font-medium">
                                    {projectCount}
                                  </span>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Projects</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    )}

                    {(event as { city?: string; country?: string }).city ||
                    (event as { city?: string; country?: string }).country ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                          {[
                            (event as { city?: string }).city,
                            (event as { country?: string }).country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {pastEvents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 py-8">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Past events
            </div>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastEvents.map(({ event, status }) => {
              const projectCount = getProjectCount(event.id);
              const href = `/events/${event.id}`;
              const isEnded = status.type === "ended";

              return (
                <Link key={event.id} href={href} className="block">
                  <Card
                    className={`cursor-pointer hover:shadow-lg transition-all hover:border-primary focus-visible:outline-none focus-visible:ring-0 outline-none overflow-hidden ${
                      isEnded ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex gap-4 p-6">
                      <div className="self-center shrink-0">
                        <EventImage
                          logoUrl={event.logo_url}
                          eventName={event.name}
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-lg leading-tight line-clamp-2 min-h-[2.8125rem]">
                              {event.name}
                            </CardTitle>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            {status.label}
                          </Badge>
                        </div>

                        {event.starts_at && event.ends_at ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 shrink-0" />
                            <span className="min-w-0 flex-1 truncate">
                              {(() => {
                                const start = new Date(event.starts_at);
                                const end = new Date(event.ends_at);
                                const startMonth = start.toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                  },
                                );
                                const endMonth = end.toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                  },
                                );
                                const startDay = start.getDate();
                                const endDay = end.getDate();
                                const year = start.getFullYear();

                                if (startMonth === endMonth) {
                                  return `${startMonth} ${startDay} - ${endDay}, ${year}`;
                                }
                                return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
                              })()}
                            </span>

                            {projectCount > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                      <Folder className="w-4 h-4 shrink-0" />
                                      <span className="font-medium">
                                        {projectCount}
                                      </span>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>Projects</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        ) : null}

                        {!event.starts_at || !event.ends_at ? (
                          <div className="flex items-center text-sm text-gray-600">
                            {projectCount > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                      <Folder className="w-4 h-4 shrink-0" />
                                      <span className="font-medium">
                                        {projectCount}
                                      </span>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>Projects</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        ) : null}

                        {(event as { city?: string; country?: string }).city ||
                        (event as { city?: string; country?: string })
                          .country ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span className="truncate">
                              {[
                                (event as { city?: string }).city,
                                (event as { country?: string }).country,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {currentEvents.length === 0 && pastEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No events found matching your criteria
          </p>
        </div>
      )}
    </div>
  );
}
