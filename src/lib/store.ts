import { create } from "zustand";
import type { Enums, Tables } from "@/database.types";

// Type aliases for cleaner code
type Event = Tables<"events">;
type Project = Tables<"projects">;
type ProjectProcessingStatus = Enums<"project_processing_status">;
type ComplexityRating = Enums<"complexity_rating">;

interface AppState {
  events: Event[];
  projects: Project[];
  selectedEventId: string | null;
  isProcessing: boolean;
  processingProjects: string[];
  theme: "light" | "dark";

  setEvents: (events: Event[]) => void;
  setProjects: (projects: Project[]) => void;
  setSelectedEventId: (id: string | null) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addProjects: (projects: Project[]) => void;
  setProcessingProjects: (ids: string[]) => void;
  toggleTheme: () => void;
}

export const useStore = create<AppState>((set) => ({
  events: [],
  projects: [],
  selectedEventId: null,
  isProcessing: false,
  processingProjects: [],
  theme:
    typeof window !== "undefined" && localStorage.getItem("theme") === "dark"
      ? "dark"
      : "light",

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
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
      }
      return { theme: newTheme };
    }),
}));

// Export types for use in other files
export type { Event, Project, ProjectProcessingStatus, ComplexityRating };
