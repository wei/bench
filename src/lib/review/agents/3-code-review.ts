import { generateObject } from "ai";
import { z } from "zod";
import { getDoAI, getDoAIModelName } from "@/lib/ai/doai";
import { setProjectStatus } from "@/lib/review/status";
import type { ReviewAgent } from "@/lib/review/types";
import { codeReviewSystemPrompt } from "@/prompts/code-review";

const codeReviewSchema = z.object({
  code_to_description_similarity_score: z.number().min(1).max(10),
  code_to_description_similarity_description: z.string(),
  technical_complexity: z.enum([
    "invalid",
    "beginner",
    "intermediate",
    "advanced",
  ]),
  technical_complexity_message: z.string(),
  tech_stack: z.array(z.string()),
});

function clampScore(score: number) {
  if (Number.isNaN(score)) return 1;
  return Math.min(10, Math.max(1, score));
}

function buildUserPrompt({
  description,
  repoContent,
}: {
  description: string;
  repoContent: string;
}) {
  return `
devpost_description:
${description || "(none provided)"}

repo_code_pack:
${repoContent || "(no code fetched)"}

Return JSON only with the keys specified in the system prompt.
`.trim();
}

export const codeReviewAgent: ReviewAgent<
  z.infer<typeof codeReviewSchema>
> = async (context) => {
  if (!context.repoInfo?.repoContent) {
    await setProjectStatus(
      context.supabase,
      context.project.id,
      "invalid:github_inaccessible",
      "Missing repository content for code review.",
    );
    return { ok: false };
  }

  const prompt = buildUserPrompt({
    description: context.project.about_the_project ?? "",
    repoContent: context.repoInfo.repoContent,
  });

  try {
    const doai = getDoAI();
    const { object } = await generateObject({
      model: doai.chat(getDoAIModelName()),
      schema: codeReviewSchema,
      system: codeReviewSystemPrompt,
      prompt,
    });

    const data = object;

    console.debug("Code review agent generated results:", data);

    const { error } = await context.supabase
      .from("projects")
      .update({
        code_to_description_similarity_score: clampScore(
          data.code_to_description_similarity_score,
        ),
        code_to_description_similarity_description:
          data.code_to_description_similarity_description,
        technical_complexity: data.technical_complexity,
        technical_complexity_message: data.technical_complexity_message,
        tech_stack: data.tech_stack,
      })
      .eq("id", context.project.id);

    if (error) {
      console.error("Code review agent: failed to persist results", error);
      return { ok: false };
    }

    return { ok: true, data };
  } catch (error) {
    console.error("Code review agent failed", error);
    await setProjectStatus(
      context.supabase,
      context.project.id,
      "errored",
      "Code review agent encountered an error.",
    );
    return { ok: false };
  }
};
