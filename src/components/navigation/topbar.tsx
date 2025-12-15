"use client";

import { Bell, Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import type { Event, Project } from "@/lib/store";
import { useStore } from "@/lib/store";

interface TopBarProps {
  readonly selectedEvent?: Event;
  readonly selectedProject?: Project | null;
}

export function TopBar({ selectedEvent, selectedProject }: TopBarProps) {
  const { setSelectedEventId, theme, toggleTheme } = useStore();

  return (
    <header className="h-16 bg-white dark:bg-[#262626] border-b border-gray-200 dark:border-[#404040] flex items-center justify-between px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={() => setSelectedEventId(null)}
              className="cursor-pointer hover:text-(--mlh-red)"
            >
              Events
            </BreadcrumbLink>
          </BreadcrumbItem>

          {selectedEvent && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {selectedProject ? (
                  <BreadcrumbLink className="cursor-pointer hover:text-(--mlh-red)">
                    {selectedEvent.name}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{selectedEvent.name}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </>
          )}

          {selectedProject && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{selectedProject.project_title}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={toggleTheme}
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </Button>

        <div className="flex items-center gap-2 ml-2">
          <Avatar className="w-8 h-8">
            <AvatarImage
              src="https://github.com/lryanle.png"
              alt="Ryan Lahlou"
            />
            <AvatarFallback>RL</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">Ryan Lahlou</span>
        </div>
      </div>
    </header>
  );
}
