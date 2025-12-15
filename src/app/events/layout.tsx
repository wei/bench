"use client";

import type { ReactNode } from "react";
import { DashboardRoot } from "@/components/dashboard/dashboard-root";

interface EventsLayoutProps {
  readonly children: ReactNode;
}

export default function EventsLayout({ children }: EventsLayoutProps) {
  return <DashboardRoot>{children}</DashboardRoot>;
}
