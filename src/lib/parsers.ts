import { parseAsArrayOf, parseAsString } from "nuqs";

export type FilterOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "in"
  | "notIn";

export type FilterVariant =
  | "text"
  | "number"
  | "range"
  | "date"
  | "dateRange"
  | "boolean"
  | "select"
  | "multiSelect";

export interface ExtendedColumnFilter {
  id: string;
  operator: FilterOperator;
  value: string | string[] | number | [number, number] | boolean;
}

export interface ExtendedColumnSort {
  id: string;
  desc: boolean;
}

export function createColumnFiltersParser() {
  return parseAsArrayOf(parseAsString.withDefault("")).withDefault([]);
}

export function createColumnSortsParser() {
  return parseAsArrayOf(parseAsString.withDefault("")).withDefault([]);
}

export function serializeFilters(filters: ExtendedColumnFilter[]): string[] {
  return filters.map(
    (filter) =>
      `${filter.id}:${filter.operator}:${JSON.stringify(filter.value)}`,
  );
}

export function deserializeFilters(
  serialized: string[],
): ExtendedColumnFilter[] {
  return serialized
    .map((item) => {
      const [id, operator, valueStr] = item.split(":");
      if (!id || !operator || !valueStr) return null;
      try {
        const value = JSON.parse(valueStr);
        return { id, operator: operator as FilterOperator, value };
      } catch {
        return null;
      }
    })
    .filter((f): f is ExtendedColumnFilter => f !== null);
}

export function serializeSorts(sorts: ExtendedColumnSort[]): string[] {
  return sorts.map((sort) => `${sort.id}:${sort.desc ? "desc" : "asc"}`);
}

export function deserializeSorts(serialized: string[]): ExtendedColumnSort[] {
  return serialized
    .map((item) => {
      const [id, direction] = item.split(":");
      if (!id || !direction) return null;
      return {
        id,
        desc: direction === "desc",
      };
    })
    .filter((s): s is ExtendedColumnSort => s !== null);
}
