"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/database.types";

type Project = Tables<"projects">;

interface CSVImportDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onImport: (data: Partial<Project>[]) => void;
  readonly eventId: string;
}

export function CSVImportDialog({
  open,
  onOpenChange,
  onImport,
  eventId,
}: CSVImportDialogProps) {
  const [csvText, setCSVText] = useState("");

  const handleImport = () => {
    if (!csvText.trim()) return;

    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());

    const projects = lines.slice(1).map((line, index) => {
      const values = line.split(",").map((v) => v.trim());
      const rowData: Record<string, string> = {};

      headers.forEach((header, i) => {
        rowData[header] = values[i] || "";
      });

      return {
        event_id: eventId,
        project_title:
          rowData.project_title ||
          rowData.title ||
          rowData.name ||
          `Untitled Project ${index + 1}`,
        github_url: rowData.github_url || rowData.github || null,
        status: "unprocessed" as const,
        tech_stack: [],
        technical_complexity: null,
        prize_results: {},
        csv_row: rowData,
      } satisfies Partial<Project>;
    });

    onImport(projects);
    setCSVText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Projects from CSV</DialogTitle>
          <DialogDescription>
            Paste your CSV data below. Include columns like: project_title,
            github_url, devpost_url
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="csv-data">CSV Data</Label>
            <Textarea
              id="csv-data"
              placeholder="project_title,github_url,devpost_url&#10;My Project,https://github.com/...,https://devpost.com/..."
              value={csvText}
              onChange={(e) => setCSVText(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
