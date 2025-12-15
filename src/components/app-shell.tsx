"use client";

import type React from "react";

import { Sidebar } from "@/components/navigation/sidebar";
import { TopBar } from "@/components/navigation/topbar";
import type { Event, Project } from "@/lib/store";

interface AppShellProps {
  readonly children: React.ReactNode;
  readonly selectedEvent?: Event;
  readonly selectedProject?: Project | null;
  readonly onEventSelect: (eventId: string | null) => void;
}

export function AppShell({
  children,
  selectedEvent,
  selectedProject,
  onEventSelect,
}: AppShellProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar onEventSelect={onEventSelect} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          selectedEvent={selectedEvent}
          selectedProject={selectedProject}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
