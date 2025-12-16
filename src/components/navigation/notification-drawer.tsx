"use client";

import { format } from "date-fns";
import { Bell, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { type NotificationEntry, useStore } from "@/lib/store";

const typeMap: Record<
  NotificationEntry["type"],
  { label: string; className: string }
> = {
  info: { label: "Info", className: "bg-blue-100 text-blue-700" },
  success: { label: "Success", className: "bg-green-100 text-green-700" },
  warning: { label: "Warning", className: "bg-yellow-100 text-yellow-700" },
  error: { label: "Error", className: "bg-red-100 text-red-700" },
};

export function NotificationDrawer() {
  const { notifications } = useStore();
  const [open, setOpen] = useState(false);

  const items = useMemo(
    () =>
      [...notifications].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    [notifications],
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        <div className="p-6 border-b border-gray-200 dark:border-[#404040]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </SheetTitle>
          </SheetHeader>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              No notifications yet
            </div>
          )}
          {items.map((note) => {
            const meta = typeMap[note.type];
            return (
              <div
                key={note.id}
                className="border border-gray-200 dark:border-[#404040] rounded-lg p-4 bg-white dark:bg-[#1f1f1f] space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <Badge className={`text-xs ${meta.className}`}>
                    {meta.label}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {format(new Date(note.timestamp), "MMM d, yyyy h:mm a")}
                  </div>
                </div>
                <p className="text-sm text-(--mlh-dark-grey) dark:text-white">
                  {note.message}
                </p>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
