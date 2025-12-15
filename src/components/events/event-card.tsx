"use client";

import { Calendar, ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Event } from "@/lib/store";

interface EventCardProps {
  readonly event: Event;
  readonly projectCount: number;
  readonly onClick: () => void;
}

export function EventCard({ event, projectCount, onClick }: EventCardProps) {
  const isActive = event.ends_at && new Date(event.ends_at) > new Date();
  const [imageError, setImageError] = useState(false);

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center gap-4">
          {event.logo_url && !imageError ? (
            <Image
              src={event.logo_url}
              alt={event.name}
              width={60}
              height={60}
              className="rounded-lg object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-[60px] h-[60px] rounded-lg bg-gray-100 flex items-center justify-center">
              <ImageOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{event.name}</CardTitle>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  isActive
                    ? "bg-(--mlh-teal) text-white"
                    : "bg-gray-300 text-gray-700"
                }`}
              >
                {isActive ? "Active" : "Ended"}
              </span>
            </div>
            {event.starts_at && event.ends_at && (
              <CardDescription className="flex items-center gap-1 mt-1">
                <Calendar className="w-4 h-4" />
                {new Date(event.starts_at).toLocaleDateString()} -{" "}
                {new Date(event.ends_at).toLocaleDateString()}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {projectCount} {projectCount === 1 ? "project" : "projects"}
        </p>
      </CardContent>
    </Card>
  );
}
