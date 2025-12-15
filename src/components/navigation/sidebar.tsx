"use client";

import { Clock, Star } from "lucide-react";
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
    .map((id) => projects.find((p) => p.id === id))
    .filter(
      (p): p is Project => p !== undefined && p.event_id === selectedEventId,
    )
    .slice(0, 10);

  return (
    <aside className="w-64 bg-white dark:bg-[#262626] border-r border-gray-200 dark:border-[#404040] flex flex-col">
      <div className="h-16 px-6 border-b border-gray-200 dark:border-[#404040] flex items-center gap-3">
        <BenchLogo className="w-8 h-4 text-(--mlh-dark-grey) dark:text-(--mlh-white)" />
        <h1 className="text-2xl font-bold text-(--mlh-dark-grey) dark:text-(--mlh-white) font-headline">
          Bench
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-6">
        {/* Favorite Projects */}
        {favoriteProjectsForEvent.length > 0 && (
          <div>
            <h2 className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Star className="w-3 h-3" />
              Favorite Projects
            </h2>
            <div className="space-y-1">
              {favoriteProjectsForEvent.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => onProjectClick(project)}
                  className="w-full text-left px-3 py-2 pl-5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors text-sm flex items-center gap-2"
                >
                  <div className="truncate flex-1">
                    {project.project_title || "Untitled"}
                  </div>
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

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
                  {recentlyViewed.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => onProjectClick(project)}
                      className="w-full text-left px-3 py-2 pl-5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors text-sm flex items-center gap-2"
                    >
                      <div className="truncate flex-1">
                        {project.project_title || "Untitled"}
                      </div>
                      {favoriteProjects.includes(project.id) && (
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {favoriteProjectsForEvent.length === 0 &&
          recentlyViewed.length === 0 && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
              No projects to display
            </div>
          )}
      </div>
    </aside>
  );
}
