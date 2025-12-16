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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CSVImportDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onImport: (insertedCount: number) => void;
  readonly eventId: string;
  readonly hasExistingProjects: boolean;
}

export function CSVImportDialog({
  open,
  onOpenChange,
  onImport,
  eventId,
  hasExistingProjects,
}: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("event_id", eventId);

    try {
      const response = await fetch("/api/projects/import-csv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload CSV");
      }

      const data = await response.json();
      onImport(data.inserted || 0);
      setFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload CSV");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>Import Projects from CSV</DialogTitle>
          <DialogDescription>
            Upload Project data exported from Devpost. (Include PII, Do not
            check Sort by Opt-In Prizes)
            <br />
            Required headers include: Project Title, Project Status, Submission
            Url, etc.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {hasExistingProjects && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm font-medium border border-destructive/20">
              Warning: This will delete all existing projects for this event.
            </div>
          )}
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || isUploading}>
            {isUploading ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
