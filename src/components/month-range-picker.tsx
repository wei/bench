"use client";

import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthRangePickerProps {
  readonly value: { start: Date | null; end: Date | null };
  readonly onChange: (value: { start: Date | null; end: Date | null }) => void;
}

export function MonthRangePicker({ value, onChange }: MonthRangePickerProps) {
  const [_isOpen, setIsOpen] = useState(false);
  const [startMonth, setStartMonth] = useState<number | null>(null);
  const [startYear, setStartYear] = useState<number | null>(null);
  const [endMonth, setEndMonth] = useState<number | null>(null);
  const [endYear, setEndYear] = useState<number | null>(null);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const _handleApply = () => {
    if (startMonth !== null && startYear !== null) {
      const start = new Date(startYear, startMonth, 1);
      let end: Date | null = null;

      if (endMonth !== null && endYear !== null) {
        end = new Date(endYear, endMonth + 1, 0); // last day of end month
      } else {
        end = new Date(startYear, startMonth + 1, 0); // last day of start month
      }

      onChange({ start, end });
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setStartMonth(null);
    setStartYear(null);
    setEndMonth(null);
    setEndYear(null);
    onChange({ start: null, end: null });
  };

  const _formatDateRange = () => {
    if (!value.start) return "Filter by date";

    const startStr = value.start.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    if (
      !value.end ||
      (value.start.getMonth() === value.end.getMonth() &&
        value.start.getFullYear() === value.end.getFullYear())
    ) {
      return startStr;
    }

    const endStr = value.end.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="flex items-center gap-1.5 border border-input rounded-md px-3 h-10 bg-background">
      <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="flex items-center gap-1.5">
        <Select
          value={startMonth?.toString() ?? ""}
          onValueChange={(v) => {
            const month = Number.parseInt(v, 10);
            setStartMonth(month);
            if (startYear !== null) {
              const start = new Date(startYear, month, 1);
              const end =
                endMonth !== null && endYear !== null
                  ? new Date(endYear, endMonth + 1, 0)
                  : new Date(startYear, month + 1, 0);
              onChange({ start, end });
            }
          }}
        >
          <SelectTrigger className="w-32 h-8 border-0 shadow-none text-sm">
            <SelectValue placeholder="Start Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month, index) => (
              <SelectItem key={month} value={index.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={startYear?.toString() ?? ""}
          onValueChange={(v) => {
            const year = Number.parseInt(v, 10);
            setStartYear(year);
            if (startMonth !== null) {
              const start = new Date(year, startMonth, 1);
              const end =
                endMonth !== null && endYear !== null
                  ? new Date(endYear, endMonth + 1, 0)
                  : new Date(year, startMonth + 1, 0);
              onChange({ start, end });
            }
          }}
        >
          <SelectTrigger className="w-20 h-8 border-0 shadow-none text-sm">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-muted-foreground text-xs">to</span>

        <Select
          value={endMonth?.toString() ?? ""}
          onValueChange={(v) => {
            const month = v ? Number.parseInt(v, 10) : null;
            setEndMonth(month);
            if (
              month !== null &&
              endYear !== null &&
              startMonth !== null &&
              startYear !== null
            ) {
              const start = new Date(startYear, startMonth, 1);
              const end = new Date(endYear, month + 1, 0);
              onChange({ start, end });
            }
          }}
        >
          <SelectTrigger className="w-32 h-8 border-0 shadow-none text-sm">
            <SelectValue placeholder="End Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month, index) => (
              <SelectItem key={month} value={index.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={endYear?.toString() ?? ""}
          onValueChange={(v) => {
            const year = v ? Number.parseInt(v, 10) : null;
            setEndYear(year);
            if (
              year !== null &&
              endMonth !== null &&
              startMonth !== null &&
              startYear !== null
            ) {
              const start = new Date(startYear, startMonth, 1);
              const end = new Date(year, endMonth + 1, 0);
              onChange({ start, end });
            }
          }}
        >
          <SelectTrigger className="w-20 h-8 border-0 shadow-none text-sm">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(startMonth !== null || endMonth !== null) && (
          <Button
            onClick={handleClear}
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
