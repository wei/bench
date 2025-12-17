"use client";

import { LogOut } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-auto px-2 py-1.5 hover:bg-transparent hover:text-current focus:text-current"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={user?.avatarUrl ?? undefined}
                  alt={fullName}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium max-w-32 truncate">
                {fullName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{fullName}</p>
                {user?.email && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/api/auth/logout"
                className="cursor-pointer flex items-center"
              >
                <LogOut className="mr-2 h-4 w-4 text-current" />
                Log out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
