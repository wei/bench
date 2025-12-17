# Supabase Postgres Schema: Bench (Simplified)

Goal: hackathon event CRUD (MLH-style fields), Devpost CSV import into a single `projects` table, per-project processing status, and prize categories (name + required_words + system_prompt).

## Conventions

- PKs: `uuid` default `gen_random_uuid()`.
- Timestamps: `timestamptz` default `now()`.
- Use `jsonb` to preserve arbitrary CSV columns.

## Extensions

```sql
create extension if not exists pgcrypto;
```

## Enums

```sql
create type project_processing_status as enum (
  'unprocessed',
  'processing:code_review',
  'processing:prize_category_review',
  'invalid:github_inaccessible',
  'invalid:rule_violation',
  'errored',
  'processed'
);

create type run_status as enum (
  'queued',
  'running',
  'succeeded',
  'failed',
  'canceled'
);

create type complexity_rating as enum (
  'invalid',
  'beginner',
  'intermediate',
  'advanced'
);

create type description_accuracy_level as enum (
  'low',
  'medium',
  'high'
);
```

## Tables

### `events`
Hackathon instance.

```sql
create table events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  slug text not null,
  name text not null,
  status text not null,
  program text,
  starts_at timestamptz,
  ends_at timestamptz,
  event_format text,
  type text,
  website_url text,
  registration_url text,
  logo_url text,
  background_url text,
  event_staff_emails text,

  constraint events_slug_unique unique (slug),
  constraint events_start_before_end check (starts_at is null or ends_at is null or starts_at < ends_at)
);

create index events_created_at_idx on events(created_at desc);
create index events_slug_idx on events(slug);
```

### `projects`
Single-table storage for all CSV columns + derived/processing fields.

Design
- Put every raw CSV header/value into `csv_row`.
- Optionally extract a few canonical columns (title, URLs, etc.) for indexing and UI.

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Canonical fields (derived from CSV if present)
  project_title text,
  submission_url text,
  project_created_at timestamptz,
  about_the_project text,
  try_it_out_links text[] not null default '{}',
  video_demo_link text,
  opt_in_prizes text not null default '',
  built_with text not null default '',
  standardized_opt_in_prizes text[] not null default '{}',

  -- Common submitter fields (also preserved in csv_row)
  submitter_first_name text,
  submitter_last_name text,
  submitter_email text,
  notes text,
  team_size numeric,

  -- GitHub
  github_url text,

  -- Raw CSV row (all columns preserved, including dynamic ones)
  csv_row jsonb not null default '{}'::jsonb,

  -- Admin/judging fields (from PRD table)
  judging_shortlist boolean not null default false,
  judging_rating numeric,
  judging_notes text,

  -- State machine (PRD §5.1)
  status project_processing_status not null default 'unprocessed',
  project_processing_status_message text,
  process_started_at timestamptz,

  description_accuracy_level description_accuracy_level, -- how well the code matches the description (low, medium, high)
  description_accuracy_message text, -- explanation for the accuracy level
  technical_complexity complexity_rating,
  technical_complexity_message text,

  tech_stack text[] not null default '{}',  -- Identify languages, frameworks, and libraries used. Output as a list (e.g., "React, Firebase, Python").

  -- Prize review outputs
  -- Suggested shape: { "mlh-best-use-gemini-api": {"usage_rating":"invalid":,"message":"..."}, ... }
  -- usage_rating options: complexity_rating enum
  prize_results jsonb not null default '{}'::jsonb
);

create index projects_event_id_idx on projects(event_id);
create index projects_status_idx on projects(event_id, status);
create index projects_shortlist_idx on projects(event_id, shortlist);
create index projects_complexity_idx on projects(event_id, complexity);
create index projects_project_title_idx on projects(event_id, project_title);
```

Notes
- `projects.csv_row` should contain every original header/value so you never lose data.
- Consider normalizing GitHub URL (lowercase, strip `.git`) in app layer.

### `prize_categories`
Global catalog of prizes, used by Grep Agent + AI usage analysis.

```sql
create table prize_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,

  -- Grep Agent required any of the words in this list; store as lowercase tokens
  find_words text[] not null default '{}',

  -- Prompt for prize-specific “usage analysis” agent
  system_prompt text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint prize_categories_slug_unique unique (slug),
  constraint prize_categories_name_unique unique (name)
);

create index prize_categories_slug_idx on prize_categories(slug);
```
