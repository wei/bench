"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getPrizeCategories } from "@/lib/data-service";

/**
 * Hook to get prize categories with React Query caching.
 * Returns the categories array and a memoized map of slug -> short_name (or name fallback) for quick lookups.
 */
export function usePrizeCategories() {
  const { data: prizeCategories = [], isLoading } = useQuery({
    queryKey: ["prize_categories"],
    queryFn: () => getPrizeCategories(),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Memoized map for quick slug -> short_name (or name fallback) lookups
  const prizeCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    prizeCategories.forEach((cat) => {
      // Use short_name if available, otherwise fall back to name
      map.set(cat.slug, cat.short_name || cat.name);
    });
    return map;
  }, [prizeCategories]);

  // Also provide as a Record for components that prefer that format
  const prizeCategoryRecord = useMemo(() => {
    const record: Record<string, string> = {};
    prizeCategories.forEach((cat) => {
      // Use short_name if available, otherwise fall back to name
      record[cat.slug] = cat.short_name || cat.name;
    });
    return record;
  }, [prizeCategories]);

  // Map for full names (slug -> name) for tooltips
  const prizeCategoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    prizeCategories.forEach((cat) => {
      map.set(cat.slug, cat.name);
    });
    return map;
  }, [prizeCategories]);

  return {
    prizeCategories,
    prizeCategoryMap,
    prizeCategoryRecord,
    prizeCategoryNameMap,
    isLoading,
  };
}
