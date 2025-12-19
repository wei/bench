import { NextResponse } from "next/server";
import Papa from "papaparse";

import type { Database } from "@/database.types";
import { getGithubUrls } from "@/lib/github/utils";
import { createClient } from "@/lib/supabase/server";

type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type CsvRecord = Record<string, string>;
type PrizeCategory = {
  slug: string;
  name: string;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const eventId = formData.get("event_id");

    if (typeof eventId !== "string" || !eventId.trim()) {
      return NextResponse.json(
        { error: "event_id is required" },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "file is required (multipart/form-data)" },
        { status: 400 },
      );
    }

    let csvText = await file.text();

    // Determine if we need to fix the headers (projects export has a weird issue with missing headers for team members)
    csvText = fixCsvHeaders(csvText);

    const records = parseCsv(csvText);

    if (!records.length) {
      return NextResponse.json(
        { error: "CSV appears to be empty" },
        { status: 400 },
      );
    }

    // Validate headers
    const requiredHeaders = [
      "Project Title",
      "Project Status",
      "Submission Url",
      "About The Project",
      "Video Demo Link",
      "Opt-In Prizes",
      "Built With",
      "Submitter First Name",
      "Submitter Last Name",
      "Submitter Email",
      "Notes",
      "Project Created At",
      '"Try it out" Links',
      "Additional Team Member Count",
    ];

    // Check headers from the first record (since PapaParse with header: true uses keys)
    const firstRecord = records[0];
    const presentHeaders = Object.keys(firstRecord);
    const missingHeaders = requiredHeaders.filter(
      (h) => !presentHeaders.includes(h),
    );

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required headers: ${missingHeaders.join(
            ", ",
          )}. Got headers: ${presentHeaders.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Delete existing projects for this event
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("event_id", eventId.trim());

    if (deleteError) {
      console.error("Failed to delete existing projects", deleteError);
      return NextResponse.json(
        { error: "Failed to clear existing projects" },
        { status: 500 },
      );
    }

    const { data: prizeCategories, error: prizeError } = await supabase
      .from("prize_categories")
      .select("slug, name");

    if (prizeError) {
      console.error("Failed to fetch prize categories", prizeError);
      return NextResponse.json(
        { error: "Failed to fetch prize categories" },
        { status: 500 },
      );
    }

    const inserts: ProjectInsert[] = records
      .filter((record) => {
        const status = record["Project Status"]?.trim();
        return (
          status === "Submitted (Gallery/Visible)" &&
          Object.values(record).some((value) => value?.trim().length > 0)
        );
      })
      .map((record) =>
        mapRecordToProject(eventId.trim(), record, prizeCategories ?? []),
      );

    if (!inserts.length) {
      return NextResponse.json(
        {
          error:
            'No eligible rows found (Project Status must be "Submitted (Gallery/Visible)")',
        },
        { status: 400 },
      );
    }

    const chunkSize = 500;
    let inserted = 0;

    for (let i = 0; i < inserts.length; i += chunkSize) {
      const chunk = inserts.slice(i, i + chunkSize);
      const { error } = await supabase.from("projects").insert(chunk);
      if (error) {
        console.error("Failed to insert projects chunk", error);
        return NextResponse.json(
          { error: "Failed to upload projects", details: error.message },
          { status: 500 },
        );
      }
      inserted += chunk.length;
    }

    return NextResponse.json({ event_id: eventId, inserted });
  } catch (error) {
    console.error("Unexpected error importing projects", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function mapRecordToProject(
  eventId: string,
  record: CsvRecord,
  prizeCategories: PrizeCategory[],
): ProjectInsert {
  const csvRow: Record<string, string> = {};
  Object.entries(record).forEach(([key, value]) => {
    csvRow[key] = value ?? "";
  });

  const project: ProjectInsert = {
    event_id: eventId,
    csv_row: csvRow,
    built_with: "",
    opt_in_prizes: "",
    try_it_out_links: [],
    standardized_opt_in_prizes: [],
    tech_stack: [],
    prize_results: {},
  };

  project.project_title = record["Project Title"] || null;
  project.submission_url = record["Submission Url"] || null;
  project.about_the_project = record["About The Project"] || null;
  project.video_demo_link = record["Video Demo Link"] || null;
  project.opt_in_prizes = record["Opt-In Prizes"]?.trim() || "";
  project.built_with = record["Built With"]?.trim() || "";
  project.submitter_first_name = record["Submitter First Name"] || null;
  project.submitter_last_name = record["Submitter Last Name"] || null;
  project.submitter_email = record["Submitter Email"] || null;
  project.notes = record.Notes || null;

  project.project_created_at = parseDate(record["Project Created At"]);

  const tryItOutRaw = record['"Try it out" Links'] ?? "";
  const tryItOutAllLinks = parseList(tryItOutRaw).filter((url) => isUrl(url));
  project.try_it_out_links = tryItOutAllLinks;

  const githubUrls = getGithubUrls(tryItOutRaw);
  project.github_url = githubUrls[0] || null;

  const additionalTeamMembers = parseNumber(
    record["Additional Team Member Count"] ?? "",
  );
  project.team_size = (additionalTeamMembers ?? 0) + 1;

  project.standardized_opt_in_prizes = matchPrizeCategories(
    project.opt_in_prizes,
    prizeCategories,
  );

  return project;
}

function parseCsv(text: string) {
  const result = Papa.parse<CsvRecord>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors?.length) {
    console.error("CSV parse errors", result.errors);
  }

  return result.data;
}

function isUrl(value: string) {
  if (!value.trim()) return false;
  const prefixed = value.startsWith("http") ? value : `https://${value}`;
  try {
    const url = new URL(prefixed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

function parseList(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function matchPrizeCategories(
  optInPrizes: string,
  categories: PrizeCategory[],
) {
  if (!optInPrizes.trim()) return [];
  const haystack = optInPrizes.toLowerCase();
  const matched = new Set<string>();

  categories.forEach((category) => {
    const nameMatch = haystack.includes(category.name.toLowerCase());
    if (nameMatch) {
      matched.add(category.slug);
    }
  });

  return Array.from(matched);
}

function fixCsvHeaders(text: string) {
  const lines = text.split("\n");
  if (lines.length === 0) return text;

  const headerLine = lines[0];
  const marker = "Team Member 1 Email";
  const markerIndex = headerLine.indexOf(marker);

  if (markerIndex === -1) {
    return text;
  }

  const TEAM_MEMBER_HEADERS = [
    "Team Member 2 First Name",
    "Team Member 2 Last Name",
    "Team Member 2 Email",
    "Team Member 3 First Name",
    "Team Member 3 Last Name",
    "Team Member 3 Email",
    "Team Member 4 First Name",
    "Team Member 4 Last Name",
    "Team Member 4 Email",
    "Team Member 5 First Name",
    "Team Member 5 Last Name",
    "Team Member 5 Email",
    "Team Member 6 First Name",
    "Team Member 6 Last Name",
    "Team Member 6 Email",
  ].join(",");

  const newHeaderLine =
    headerLine.slice(0, markerIndex + marker.length) +
    "," +
    TEAM_MEMBER_HEADERS;

  lines[0] = newHeaderLine;
  return lines.join("\n");
}
