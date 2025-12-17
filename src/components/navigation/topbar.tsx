"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BenchLogo } from "@/components/icons/bench-logo";
import { NotificationDrawer } from "@/components/navigation/notification-drawer";
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
import { useSession } from "@/hooks/use-session";
import type { Event, Project } from "@/lib/store";

interface TopBarProps {
  readonly selectedEvent?: Event;
  readonly selectedProject?: Project | null;
}
export function TopBar({ selectedEvent, selectedProject }: TopBarProps) {
  const pathname = usePathname();
  const { user, isLoading } = useSession();
  const isEventsPage = pathname === "/events";

  const fullName = isLoading
    ? "Loading..."
    : user
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : "Guest";

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}` || "MLH"
    : "MLH";

  return (
    <header className="h-16 bg-white dark:bg-[#262626] border-b border-gray-200 dark:border-[#404040] flex items-center justify-between px-6">
      <Breadcrumb>
        <BreadcrumbList>
          {isEventsPage && (
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href="/events"
                  className="flex items-center gap-3 mr-2 hover:opacity-80 transition-opacity"
                >
                  <BenchLogo className="w-8 h-4 text-(--mlh-dark-grey) dark:text-(--mlh-white)" />
                  <h1 className="text-2xl font-bold text-(--mlh-dark-grey) dark:text-(--mlh-white) font-headline">
                    Bench
                  </h1>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          )}
          {!isEventsPage && (
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href="/events"
                  className="cursor-pointer hover:text-(--mlh-red)"
                >
                  Events
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          )}

          {selectedEvent && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {selectedProject ? (
                  <BreadcrumbLink asChild>
                    <Link
                      href={`/events/${selectedEvent.id}`}
                      className="cursor-pointer hover:text-(--mlh-red)"
                    >
                      {selectedEvent.name}
                    </Link>
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
        <NotificationDrawer />

        <div className="flex items-center gap-2 ml-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.avatarUrl ?? undefined} alt={fullName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium max-w-32 truncate">
            {fullName}
          </span>
          <Button asChild variant="outline" size="sm">
            <Link href="/api/auth/logout">Log out</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
