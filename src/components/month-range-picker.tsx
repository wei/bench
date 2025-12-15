"use client";

import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [isOpen, setIsOpen] = useState(false);
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

  const handleApply = () => {
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
    setIsOpen(false);
  };

  const formatDateRange = () => {
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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <CalendarIcon className="w-4 h-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="start-month"
              className="text-sm font-medium mb-2 block"
            >
              Start Date
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={startMonth?.toString()}
                onValueChange={(v) => setStartMonth(Number.parseInt(v, 10))}
              >
                <SelectTrigger id="start-month">
                  <SelectValue placeholder="Month" />
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
                value={startYear?.toString()}
                onValueChange={(v) => setStartYear(Number.parseInt(v, 10))}
              >
                <SelectTrigger id="start-year">
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
            </div>
          </div>

          <div>
            <label
              htmlFor="end-month"
              className="text-sm font-medium mb-2 block"
            >
              End Date (Optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={endMonth?.toString() ?? ""}
                onValueChange={(v) =>
                  setEndMonth(v ? Number.parseInt(v, 10) : null)
                }
              >
                <SelectTrigger id="end-month">
                  <SelectValue placeholder="Month" />
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
                onValueChange={(v) =>
                  setEndYear(v ? Number.parseInt(v, 10) : null)
                }
              >
                <SelectTrigger id="end-year">
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
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleApply}
              className="flex-1 bg-[#e42d42] hover:bg-[#d02839]"
            >
              Apply
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              className="flex-1 bg-transparent"
            >
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
