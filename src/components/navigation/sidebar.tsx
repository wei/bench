"use client";

import { Clock, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BenchLogo } from "@/components/icons/bench-logo";
import { type Project, useStore } from "@/lib/store";

interface SidebarProps {
  readonly onProjectClick: (project: Project) => void;
}

export function Sidebar({ onProjectClick }: SidebarProps) {
  const {
    projects,
    selectedEventId,
    recentlyViewedProjects,
    favoriteProjects,
    toggleFavoriteProject,
  } = useStore();
  const [showRecentlyViewed, setShowRecentlyViewed] = useState(false);

  // If no event is selected, don't show sidebar
  if (!selectedEventId) {
    return null;
  }

  // Favorite projects for the event
  const favoriteProjectsForEvent = projects.filter(
    (p) => p.event_id === selectedEventId && favoriteProjects.includes(p.id),
  );

  // Get recently viewed projects for the selected event
  const recentlyViewed = recentlyViewedProjects
    .map((item) => {
      const project = projects.find((p) => p.id === item.id);
      return project ? { project, timestamp: item.timestamp } : null;
    })
    .filter(
      (item): item is { project: Project; timestamp: string } =>
        item !== null && item.project.event_id === selectedEventId,
    )
    .slice(0, 10);

  // Format time since last viewed
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const viewed = new Date(timestamp);
    const diffMs = now.getTime() - viewed.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return `${diffSec}s`;
    } else if (diffMin < 60) {
      return `${diffMin}m`;
    } else if (diffHour < 24) {
      return `${diffHour}hr`;
    } else {
      return `${diffDay}d`;
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-[#262626] border-r border-gray-200 dark:border-[#404040] flex flex-col">
      <div className="h-16 px-6 border-b border-gray-200 dark:border-[#404040] flex items-center gap-3">
        <Link
          href="/events"
          className="flex items-center gap-3 mr-2 hover:opacity-80 transition-opacity"
        >
          <BenchLogo className="w-8 h-4 text-(--mlh-dark-grey) dark:text-(--mlh-white)" />
          <h1 className="text-2xl font-bold text-(--mlh-dark-grey) dark:text-(--mlh-white) font-headline">
            Bench
          </h1>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-6">
        {/* Favorite Projects */}
        <div>
          <h2 className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Star className="w-3 h-3" />
            Favorite Projects
          </h2>
          {favoriteProjectsForEvent.length > 0 ? (
            <div className="space-y-1">
              {favoriteProjectsForEvent.map((project) => (
                <div
                  key={project.id}
                  className="w-full px-3 py-2 pl-5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors text-sm flex items-center gap-2 group"
                >
                  <button
                    type="button"
                    onClick={() => onProjectClick(project)}
                    className="truncate flex-1 text-left"
                  >
                    {project.project_title || "Untitled"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteProject(project.id);
                    }}
                    className="shrink-0 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors cursor-pointer"
                    aria-label="Remove from favorites"
                  >
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
              Star a project to add it here
            </div>
          )}
        </div>

        <div className="mt-auto space-y-2">
          {recentlyViewed.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowRecentlyViewed((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Recently Viewed
                </span>
                <span>{showRecentlyViewed ? "−" : "+"}</span>
              </button>
              {showRecentlyViewed && (
                <div className="space-y-1">
                  {recentlyViewed.map((item) => (
                    <button
                      key={item.project.id}
                      type="button"
                      onClick={() => onProjectClick(item.project)}
                      className="w-full text-left px-3 py-2 pl-5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors text-sm flex items-center gap-2"
                    >
                      <div className="truncate flex-1">
                        {item.project.project_title || "Untitled"}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatTimeAgo(item.timestamp)}
                        </span>
                        {favoriteProjects.includes(item.project.id) && (
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
