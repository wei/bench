"use client";

import Image from "next/image";
import { useState } from "react";
import { Calendar, ImageOff, MapPin, Search } from "lucide-react";
import { MonthRangePicker } from "@/components/month-range-picker";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";

interface EventsPageProps {
  readonly onEventSelect: (eventId: string) => void;
}

type EventStatus = {
  type: "upcoming" | "active" | "ended";
  label: string;
  daysUntil?: number;
};

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

export function EventsPage({ onEventSelect }: EventsPageProps) {
  const { events, projects } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });

  const filteredEvents = events
    .filter((event) => {
      // search filter
      const matchesSearch = event.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // date range filter
      let matchesDateRange = true;
      if (dateRange.start || dateRange.end) {
        if (!event.starts_at || !event.ends_at) {
          matchesDateRange = false;
        } else {
          const eventStart = new Date(event.starts_at);
          const eventEnd = new Date(event.ends_at);

          if (dateRange.start && dateRange.end) {
            matchesDateRange =
              eventStart <= dateRange.end && eventEnd >= dateRange.start;
          } else if (dateRange.start) {
            matchesDateRange = eventEnd >= dateRange.start;
          } else if (dateRange.end) {
            matchesDateRange = eventStart <= dateRange.end;
          }
        }
      }

      return matchesSearch && matchesDateRange;
    })
    .sort((a, b) => {
      // Sort by start date (soonest first)
      // Events without dates go to the end
      if (!a.starts_at && !b.starts_at) return 0;
      if (!a.starts_at) return 1;
      if (!b.starts_at) return -1;
      return (
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      );
    });

  const getProjectCount = (eventId: string) => {
    return projects.filter((p) => p.event_id === eventId).length;
  };

  const getEventStatus = (
    startsAt: string | null,
    endsAt: string | null,
  ): EventStatus => {
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
    } else {
      return {
        type: "upcoming",
        label: `In ${diffDays} days`,
        daysUntil: diffDays,
      };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hackathon Events</h1>
        <p className="text-gray-600 mt-1">
          Manage and review hackathon projects
        </p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <MonthRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => {
          const projectCount = getProjectCount(event.id);
          const eventStatus = getEventStatus(event.starts_at, event.ends_at);

          return (
            <Card
              key={event.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-[#e42d42] overflow-hidden"
              onClick={() => onEventSelect(event.id)}
            >
              <div className="flex gap-4 p-6">
                {/* Hackathon Image - Square on the left */}
                <EventImage logoUrl={event.logo_url} eventName={event.name} />

                {/* Content Section */}
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                  {/* Header with Title and Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight line-clamp-2">
                      {event.name}
                    </CardTitle>
                    {(() => {
                      const badgeVariant =
                        eventStatus.type === "active" ||
                        eventStatus.type === "upcoming"
                          ? "default"
                          : "secondary";
                      let badgeClassName = "shrink-0";
                      if (eventStatus.type === "active") {
                        badgeClassName = "bg-green-500 shrink-0";
                      } else if (eventStatus.type === "upcoming") {
                        badgeClassName = "bg-blue-500 shrink-0";
                      }
                      return (
                        <Badge variant={badgeVariant} className={badgeClassName}>
                          {eventStatus.label}
                        </Badge>
                      );
                    })()}
                  </div>

                  {/* Date Range */}
                  {event.starts_at && event.ends_at && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {(() => {
                          const start = new Date(event.starts_at);
                          const end = new Date(event.ends_at);
                          const startMonth = start.toLocaleDateString("en-US", {
                            month: "short",
                          });
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
                    </div>
                  )}

                  {/* Location (City, Country) */}
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

                  {/* Project Count */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-gray-600">Projects</span>
                    <Badge variant="outline" className="font-semibold">
                      {projectCount}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No events found matching your criteria
          </p>
        </div>
      )}
    </div>
  );
}
