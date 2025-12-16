"use client";

import { X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";

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
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileValidate = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      return "Only CSV files are allowed";
    }
    if (file.size > 10 * 1024 * 1024) {
      return "File must be smaller than 10MB";
    }
    return null;
  };

  const handleUpload = useCallback(
    async (uploadFiles: File[]) => {
      if (uploadFiles.length === 0) return;

      const file = uploadFiles[0];
      setIsUploading(true);
      setError(null);

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
        setFiles([]);
        onOpenChange(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to upload CSV";
        setError(errorMessage);
        console.error("Upload error:", err);
      } finally {
        setIsUploading(false);
      }
    },
    [eventId, onImport, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Projects</DialogTitle>
          <DialogDescription>
            Upload a CSV file exported from Devpost
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 min-w-0">
          {hasExistingProjects && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3 rounded-md">
              Warning: This will delete all existing projects for this event.
            </div>
          )}

          <FileUpload
            value={files}
            onValueChange={setFiles}
            accept=".csv"
            maxFiles={1}
            maxSize={10 * 1024 * 1024}
            onFileValidate={handleFileValidate}
            disabled={isUploading}
          >
            <FileUploadDropzone className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent/50 transition-colors">
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">
                  Drag CSV file here
                </div>
                <div className="text-xs text-muted-foreground">or</div>
                <FileUploadTrigger asChild>
                  <Button variant="outline" size="sm" type="button">
                    Choose File
                  </Button>
                </FileUploadTrigger>
              </div>
            </FileUploadDropzone>

            <FileUploadList className="space-y-2">
              <FileUploadItem
                value={files[0]}
                className="flex items-center gap-3 p-3 border rounded-md bg-accent/30"
              >
                <FileUploadItemPreview className="shrink-0" />
                <FileUploadItemMetadata className="flex-1 min-w-0 overflow-hidden" />
                <FileUploadItemDelete asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </FileUploadItemDelete>
              </FileUploadItem>
            </FileUploadList>
          </FileUpload>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (files.length > 0) {
                handleUpload(files);
              }
            }}
            disabled={files.length === 0 || isUploading}
            type="button"
          >
            {isUploading ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
