"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { DevpostIcon } from "@/components/icons/devpost-icon";
import { GithubIcon } from "@/components/icons/github-icon";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { parsePrizeResults } from "@/lib/project-utils";
import type { Project } from "@/lib/store";

interface ProjectDetailSheetProps {
  readonly project: Project | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function ProjectDetailSheet({
  project,
  open,
  onOpenChange,
}: ProjectDetailSheetProps) {
  if (!project) return null;

  const prizeResults = parsePrizeResults(project.prize_results);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">{project.project_title}</SheetTitle>
          <SheetDescription>Project Analysis Details</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Links */}
          <div className="flex gap-4">
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-(--mlh-blue) hover:underline"
              >
                <GithubIcon className="w-4 h-4" />
                GitHub Repository
              </a>
            )}
            {project.submission_url && (
              <a
                href={project.submission_url || ""}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-(--mlh-blue) hover:underline"
              >
                <DevpostIcon className="w-4 h-4" />
                Devpost
              </a>
            )}
          </div>

          {/* Technical Details */}
          <div>
            <h3 className="font-semibold mb-2">Technical Details</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Complexity:
                </span>
                <Badge>{project.technical_complexity || "Not analyzed"}</Badge>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">
                  Tech Stack:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {project.tech_stack.length > 0 ? (
                    project.tech_stack.map((tech) => (
                      <Badge key={tech} variant="outline">
                        {tech}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Not analyzed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Prize Results */}
          {prizeResults && Object.keys(prizeResults).length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Prize Category Analysis</h3>
              <div className="space-y-3">
                {Object.entries(prizeResults).map(([category, result]) => (
                  <div
                    key={category}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {category.replaceAll("_", " ").toUpperCase()}
                      </h4>
                      <div className="flex items-center gap-2">
                        {result.status === "valid" ? (
                          <CheckCircle2 className="w-5 h-5 text-(--mlh-teal)" />
                        ) : (
                          <XCircle className="w-5 h-5 text-(--mlh-red)" />
                        )}
                        <Badge
                          variant={
                            result.status === "valid"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {result.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {result.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw CSV Data */}
          <Accordion type="single" collapsible>
            <AccordionItem value="csv">
              <AccordionTrigger>Raw CSV Data</AccordionTrigger>
              <AccordionContent>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                  {JSON.stringify(project.csv_row, null, 2)}
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}
