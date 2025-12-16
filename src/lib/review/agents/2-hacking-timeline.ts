import { fetchCommitDates } from "@/lib/review/github";
import { setProjectStatus } from "@/lib/review/status";
import type { ReviewAgent } from "@/lib/review/types";

type CommitDates = { firstCommitAt: string; lastCommitAt: string };

export const hackingTimelineAgent: ReviewAgent<CommitDates> = async (
  context,
) => {
  if (!context.repoInfo) {
    await setProjectStatus(
      context.supabase,
      context.project.id,
      "invalid:github_inaccessible",
      "Missing repository context for timeline validation.",
    );
    return { ok: false };
  }

  console.debug(
    `Repo is accessible for project ID ${context.project.id}, proceeding to fetch commit dates.`,
  );
  const commitDates = await fetchCommitDates(context.github, context.repoInfo);
  if (!commitDates.ok) {
    const status = commitDates.message.includes("Unexpected error")
      ? "errored"
      : "invalid:github_inaccessible";

    await setProjectStatus(
      context.supabase,
      context.project.id,
      status,
      commitDates.message,
    );
    return { ok: false };
  }

  const startsAt = context.project.event?.starts_at;
  const endsAt = context.project.event?.ends_at;

  if (startsAt && endsAt) {
    const firstCommit = new Date(commitDates.firstCommitAt);
    const lastCommit = new Date(commitDates.lastCommitAt);

    if (firstCommit < new Date(startsAt) || lastCommit > new Date(endsAt)) {
      const message = `Commits fall outside event window.`;
      await setProjectStatus(
        context.supabase,
        context.project.id,
        "invalid:rule_violation",
        message,
      );
      return { ok: false };
    }
  }

  console.debug(
    `Project ID ${context.project.id}'s commit dates are within the hacking period.`,
  );
  return { ok: true, data: commitDates };
};
