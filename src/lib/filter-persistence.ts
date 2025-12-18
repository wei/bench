/**
 * Utilities for persisting filter settings in sessionStorage
 * Keyed by event ID so each event has its own filter state
 */

export interface FilterState {
  title?: string;
  status?: string[];
  complexity?: string[];
  prizeTrack?: string | null;
  techStack?: string[];
  techStackMode?: "intersection" | "union";
  hasGithub?: boolean;
  showMlhPrizesOnly?: boolean;
  isJudgingView?: boolean;
  columnVisibility?: Record<string, boolean>;
  // Sorting state from @tanstack/react-table (id and direction per column)
  sorting?: Array<{
    id: string;
    desc?: boolean;
  }>;
}

const STORAGE_KEY_PREFIX = "event-filters-";

function getStorageKey(eventId: string | null): string | null {
  if (!eventId) return null;
  return `${STORAGE_KEY_PREFIX}${eventId}`;
}

/**
 * Load filter state for a specific event from sessionStorage
 */
export function loadFilterState(eventId: string | null): Partial<FilterState> {
  if (typeof globalThis.window === "undefined" || !eventId) {
    return {};
  }

  const storageKey = getStorageKey(eventId);
  if (!storageKey) return {};

  try {
    const stored = sessionStorage.getItem(storageKey);
    if (!stored) return {};
    return JSON.parse(stored) as FilterState;
  } catch (error) {
    console.error("Failed to load filter state:", error);
    return {};
  }
}

/**
 * Save filter state for a specific event to sessionStorage
 */
export function saveFilterState(
  eventId: string | null,
  state: Partial<FilterState>,
): void {
  if (typeof globalThis.window === "undefined" || !eventId) {
    return;
  }

  const storageKey = getStorageKey(eventId);
  if (!storageKey) return;

  try {
    sessionStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save filter state:", error);
  }
}

/**
 * Clear filter state for a specific event
 */
export function clearFilterState(eventId: string | null): void {
  if (typeof globalThis.window === "undefined" || !eventId) {
    return;
  }

  const storageKey = getStorageKey(eventId);
  if (!storageKey) return;

  try {
    sessionStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Failed to clear filter state:", error);
  }
}
