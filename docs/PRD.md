# Product Requirement Document: Bench (Hackathon AI Auditor and Judge)

Version: 1.0

Status: Draft

Date: December 14, 2025

## 1\. Executive Summary

Bench is a web-based tool designed to streamline the judging and verification process for large-scale hackathons. By ingesting project data from Devpost and source code from GitHub, the system utilizes AI agents to automate technical due diligence (validity, timing, code complexity) and verify eligibility for specific prize categories (e.g., MLH prizes).

## 2\. User Personas

-   Hackathon Admin/Manager: Responsible for setting up the event, importing submissions, and ensuring all projects adhere to the rules.

-   Judge: Responsible for reviewing valid projects, filtering by prize categories, and shortlisting winners.


## 3\. Functional Requirements

### Epic 1: Import from Devpost & Roster Creation

Goal: Allow users to instantiate a hackathon event and populate it with project data via CSV.

ID

Requirement

Description

Notes
# Product Requirement Document: Hackathon AI Auditor

Version: 1.0

Status: Draft

Date: December 14, 2025

## 1. Executive Summary

The Hackathon AI Auditor is a web-based tool designed to streamline the judging and verification process for large-scale hackathons. By ingesting project data from Devpost and source code from GitHub, the system utilizes AI agents to automate technical due diligence (validity, timing, code complexity) and verify eligibility for specific prize categories (e.g., MLH prizes).

## 2. User Personas

- Hackathon Admin/Manager: Responsible for setting up the event, importing submissions, and ensuring all projects adhere to the rules.
- Judge: Responsible for reviewing valid projects, filtering by prize categories, and shortlisting winners.

## 3. Functional Requirements

### Epic 1: Import from Devpost & Roster Creation

Goal: Allow users to instantiate a hackathon event and populate it with project data via CSV.

- 1.1 Create Event — User can create a new "Hackathon Instance." Requires input for Event Name, Hacking Start Date/Time, and Hacking End Date/Time.
- 1.2 CSV Upload — User can upload a Devpost Project Submissions export CSV.
- 1.3 Column Mapping — System must ingest dynamic CSV columns.
	- Standard Map: Project Name, Description, Link, Submitter Info, GitHub URL, Opt-ins.
	- Dynamic Map: Keep all other custom columns available for reference.
	- Prize Map: Identify MLH Prize Categories from opt-ins.
- 1.4 Roster View — User can view the list of imported projects on the Event Page. Initial status for all projects is "Unprocessed".

### Epic 2: Code Review Agent

Goal: Automate the technical validity check and code quality assessment using AI.

- 2.1 Execution Trigger — Agent is triggered via "Run" button (individual) or "Process All" (batch).
- 2.2 GitHub Access Check — Verify if the provided GitHub URL is valid and the repo is public. Output: Valid/Invalid + Message (e.g., "Repo 404").
- 2.3 Timeframe Validation — Analyze commit history against Hackathon Start/End times. Output: Pass/Fail (Red/Green). Flag if > X% of code was written outside the timeframe.
- 2.4 Source Retrieval — Fetch full source code context. Tool: Use Repomix to pack repository content for the LLM.
- 2.5 AI Inference — Send prompt to AI SDK with: System Prompt, Devpost Description, Repomix Source Code.
- 2.6 Similarity Check — Analyze if the codebase matches the Devpost description. Detects embellishment or "vaporware".
- 2.7 Tech Stack Analysis — Identify languages, frameworks, and libraries used. Output as a list (e.g., "React, Firebase, Python").
- 2.8 Complexity Review — Assess the code quality and complexity. Levels: Beginner, Intermediate, Advanced. Notes: Brief justification for the rating.

### Epic 3: Prize Category Review Agent

Goal: Verify if a project actually utilizes the technology required for the prizes they opted into.

- 3.1 Sequential Trigger — Triggered automatically after Epic 2 (Code Review) completes successfully.
- 3.2 Parallel Processing — Spin up a sub-agent for each Prize Category opt-in detected for the project.
- 3.3 Grep Agent (Filter) — Perform a keyword check (imports, package.json dependencies) before calling AI. Logic: If required_words for the prize are missing, mark Invalid immediately to save tokens.
- 3.4 Usage Analysis — If Grep passes, send AI inference request to analyze specific implementation of the technology. Focus on how it is used, not just that it exists.
- 3.5 Prize Outputs — Store results per category. Status: Valid/Invalid. Message: Reason for invalidity. Usage: Explanation of features used.

## 4. UI/UX Requirements (Epic 4)

### 4.1 Dashboard & Navigation

- Hackathon List: View all created hackathon instances.
- Instance Dashboard: When an instance is selected, show the Project Data Table.

### 4.2 Project Data Table

The core workspace for Admins/Judges.

- Columns:
	- Status (Icon/Color encoded)
	- Project Name
	- GitHub Status (Valid/Invalid)
	- Complexity Rating (Beginner/Int/Adv)
	- Tech Stack
	- Shortlist (Checkbox)
	- Rating (Numeric Input)
	- Admin Notes (Text Input)
	- Prize Categories (Tags)

- Controls:
	- Global Run Button: Triggers processing for all "Unprocessed" projects.
	- Row Actions: "Run" (if new), "Rerun" (if processed).
	- Filtering: Filter by Status, Complexity, Prize Category, Shortlist.
	- Sorting: Sort by Name, Rating, Complexity.

### 4.3 Detailed Project View (Modal/Popup)

Triggered by clicking a table row.

- Header: Project Name, Links (Devpost, GitHub), Team Members.
- Media: Embedded YouTube video (if link exists), Image Gallery (from Devpost).
- AI Analysis Results:
	- Code Review Summary (Complexity, Tech Stack, Timeframe check).
	- Prize Category Breakdown: List of all opted prizes with Green/Red indicators and AI explanation of usage.

### 4.4 Status Visualizer

- Component: A visual cluster of circular indicators representing all projects in the event.
- Function: Allows broad "health check" of the event processing queue.
- Color Mapping:
	- Gray: Processing / Queued
	- Green: Completed & Valid
	- Red: Invalid / Rule Violation / Inaccessible
	- Yellow: Review Needed

## 5. System Logic & States

### 5.1 Project Status State Machine

A project tracks its lifecycle through the following statuses:

1. Unprocessed: Newly imported.
2. Processing: Global state when agents are running.
	- Sub-state: GitHub Agent (Checking URL/Access)
	- Sub-state: Code Review (Repomix + Complexity Analysis)
	- Sub-state: Prize Category Review (Grep + Usage Analysis)
3. Completed: All agents finished successfully.
4. Inaccessible: GitHub URL invalid or private.
5. Rule Violation: Commits outside start/end date.
6. Invalid Submission: Code does not match description significantly.

## 6. Technical Stack Requirements

- Source Control: GitHub API.
- Context Fetching: Repomix (for packing repo to text).
- AI Inference: Vercel AI SDK (or similar).
- Frontend: React (implied by component descriptions).
- Backend: Node.js/Python (capable of handling long-running agent jobs).
