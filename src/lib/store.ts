import { create } from "zustand";
import type { Enums, Tables } from "@/database.types";

// Type aliases for cleaner code
type Event = Tables<"events">;
type Project = Tables<"projects">;
type ProjectProcessingStatus = Enums<"project_processing_status">;
type ComplexityRating = Enums<"complexity_rating">;
type NotificationType = "info" | "success" | "warning" | "error";

interface NotificationEntry {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: string;
}

interface AppState {
  events: Event[];
  projects: Project[];
  selectedEventId: string | null;
  isProcessing: boolean;
  processingProjects: string[];
  showProcessingModal: boolean;
  theme: "light" | "dark";
  recentlyViewedProjects: string[];
  favoriteProjects: string[];
  notifications: NotificationEntry[];

  setEvents: (events: Event[]) => void;
  setProjects: (projects: Project[]) => void;
  setSelectedEventId: (id: string | null) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addProjects: (projects: Project[]) => void;
  setProcessingProjects: (ids: string[]) => void;
  setShowProcessingModal: (open: boolean) => void;
  toggleTheme: () => void;
  addRecentlyViewedProject: (projectId: string) => void;
  toggleFavoriteProject: (projectId: string) => void;
  addNotification: (entry: Omit<NotificationEntry, "id" | "timestamp">) => void;
}

export const useStore = create<AppState>((set) => ({
  events: [],
  projects: [],
  selectedEventId: null,
  isProcessing: false,
  processingProjects: [],
  showProcessingModal: false,
  theme:
    typeof window !== "undefined" && localStorage.getItem("theme") === "dark"
      ? "dark"
      : "light",
  recentlyViewedProjects:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("recentlyViewedProjects") || "[]")
      : [],
  favoriteProjects:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("favoriteProjects") || "[]")
      : [],
  notifications:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("notifications") || "[]")
      : [],

  setEvents: (events) => set({ events }),
  setProjects: (projects) => set({ projects }),
  setSelectedEventId: (id) => set({ selectedEventId: id }),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    })),
  addProjects: (newProjects) =>
    set((state) => ({
      projects: [...state.projects, ...newProjects],
    })),
  setProcessingProjects: (ids) => set({ processingProjects: ids }),
  setShowProcessingModal: (open) => set({ showProcessingModal: open }),
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
      }
      return { theme: newTheme };
    }),
  addRecentlyViewedProject: (projectId) =>
    set((state) => {
      const updated = [
        projectId,
        ...state.recentlyViewedProjects.filter((id) => id !== projectId),
      ].slice(0, 10); // Keep only last 10
      if (typeof window !== "undefined") {
        localStorage.setItem("recentlyViewedProjects", JSON.stringify(updated));
      }
      return { recentlyViewedProjects: updated };
    }),
  toggleFavoriteProject: (projectId) =>
    set((state) => {
      const isFavorite = state.favoriteProjects.includes(projectId);
      const updated = isFavorite
        ? state.favoriteProjects.filter((id) => id !== projectId)
        : [...state.favoriteProjects, projectId];
      if (typeof window !== "undefined") {
        localStorage.setItem("favoriteProjects", JSON.stringify(updated));
      }
      return { favoriteProjects: updated };
    }),
  addNotification: ({ message, type }) =>
    set((state) => {
      const entry: NotificationEntry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        message,
        type,
        timestamp: new Date().toISOString(),
      };
      const updated = [entry, ...state.notifications].slice(0, 200);
      if (typeof window !== "undefined") {
        localStorage.setItem("notifications", JSON.stringify(updated));
      }
      return { notifications: updated };
    }),
}));

// Export types for use in other files
export type {
  Event,
  Project,
  ProjectProcessingStatus,
  ComplexityRating,
  NotificationEntry,
  NotificationType,
};
