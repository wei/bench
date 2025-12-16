import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateObject, generateText } from "ai";
import { z } from "zod";
// import { google } from "@ai-sdk/google";
// import { getDoAI, getDoAIModelName } from "@/lib/ai/doai";
import { setProjectStatus } from "@/lib/review/status";
import type { ReviewAgent } from "@/lib/review/types";
import { codeReviewSystemPrompt } from "@/prompts/code-review";

const codeReviewSchema = z.object({
  description_accuracy_level: z.enum(["low", "medium", "high"]),
  description_accuracy_message: z.string(),
  technical_complexity: z.enum([
    "invalid",
    "beginner",
    "intermediate",
    "advanced",
  ]),
  technical_complexity_message: z.string(),
  tech_stack: z.array(z.string()),
});

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

/**
 * Attempts to repair malformed JSON by extracting the last valid JSON object
 * from a corrupted response. Handles cases where JSON objects are duplicated
 * or embedded within string values.
 */
function repairMalformedJson(text: string): string | null {
  try {
    // First, try to parse as-is
    JSON.parse(text);
    return text;
  } catch {
    // If parsing fails, try to extract valid JSON
  }

  // Strategy 1: Handle case where JSON object appears in the middle of a string value
  // Pattern: "text{"key":"value"}" - extract text before the embedded JSON
  const embeddedJsonPattern =
    /("description_accuracy_message"\s*:\s*")([^"]*?)(\{[^}]*\})([^"]*?)(")/;
  const embeddedMatch = embeddedJsonPattern.exec(text);
  if (embeddedMatch) {
    const before = embeddedMatch[1];
    const textBefore = embeddedMatch[2];
    const after = embeddedMatch[5];
    const cleaned = text.replace(
      embeddedMatch[0],
      `${before}${textBefore}${after}`,
    );
    try {
      JSON.parse(cleaned);
      return cleaned;
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 2: Find the last complete JSON object by tracking braces
  const jsonStart = text.indexOf("{");
  if (jsonStart === -1) return null;

  let braceCount = 0;
  let lastValidEnd = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = jsonStart; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    // If we're in a string and encounter a {, this might be an embedded JSON
    // Try to detect and skip it
    if (inString && char === "{") {
      // Look ahead to see if this is a complete JSON object
      let tempBraceCount = 1;
      let tempInString = false;
      let tempEscapeNext = false;
      let foundEnd = false;
      let skipTo = i;

      for (let j = i + 1; j < text.length && tempBraceCount > 0; j++) {
        const tempChar = text[j];
        if (tempEscapeNext) {
          tempEscapeNext = false;
          continue;
        }
        if (tempChar === "\\") {
          tempEscapeNext = true;
          continue;
        }
        if (tempChar === '"' && !tempEscapeNext) {
          tempInString = !tempInString;
          continue;
        }
        if (tempInString) continue;
        if (tempChar === "{") tempBraceCount++;
        if (tempChar === "}") {
          tempBraceCount--;
          if (tempBraceCount === 0) {
            foundEnd = true;
            skipTo = j;
            break;
          }
        }
      }
      if (foundEnd) {
        i = skipTo;
        continue;
      }
    }

    if (inString) continue;

    if (char === "{") {
      braceCount++;
    } else if (char === "}") {
      braceCount--;
      if (braceCount === 0) {
        lastValidEnd = i + 1;
      }
    }
  }

  if (lastValidEnd > jsonStart) {
    const candidate = text.substring(jsonStart, lastValidEnd);
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 3: Find the last occurrence of a complete JSON object
  const lastBrace = text.lastIndexOf("}");
  if (lastBrace !== -1) {
    let count = 1;
    let start = lastBrace;
    inString = false;
    escapeNext = false;

    for (let i = lastBrace - 1; i >= 0 && count > 0; i--) {
      const char = text[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === "}") {
        count++;
      } else if (char === "{") {
        count--;
        if (count === 0) {
          start = i;
        }
      }
    }

    if (count === 0) {
      const candidate = text.substring(start, lastBrace + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        // Continue to next strategy
      }
    }
  }

  return null;
}

/**
 * Generates an object with retry logic and JSON repair fallback
 */
async function generateObjectWithRetry({
  model,
  schema,
  system,
  prompt,
  maxRetries = 3,
}: {
  model: Parameters<typeof generateObject>[0]["model"];
  schema: z.ZodSchema;
  system: string;
  prompt: string;
  maxRetries?: number;
}): Promise<z.infer<typeof codeReviewSchema>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { object } = await generateObject({
        model,
        schema,
        system,
        prompt,
      });
      return object as z.infer<typeof codeReviewSchema>;
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `generateObject attempt ${attempt + 1}/${maxRetries} failed:`,
        error instanceof Error ? error.message : String(error),
      );

      // If this is the last attempt, try fallback strategy
      if (attempt === maxRetries - 1) {
        console.log("Attempting fallback: generateText + manual JSON parsing");
        try {
          const { text } = await generateText({
            model,
            system,
            prompt: `${prompt}\n\nIMPORTANT: Return ONLY valid JSON. Do not include any text before or after the JSON object.`,
          });

          // Try to repair malformed JSON
          const repaired = repairMalformedJson(text);
          if (repaired) {
            const parsed = JSON.parse(repaired);
            const validated = schema.parse(parsed);
            return validated as z.infer<typeof codeReviewSchema>;
          }

          // Try to extract JSON from markdown code blocks
          const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*\})\s*```/;
          const jsonBlockMatch = jsonBlockRegex.exec(text);
          if (jsonBlockMatch) {
            const parsed = JSON.parse(jsonBlockMatch[1]);
            const validated = schema.parse(parsed);
            return validated as z.infer<typeof codeReviewSchema>;
          }

          // Try to find JSON object in the text
          const jsonObjectRegex = /\{[\s\S]*\}/;
          const jsonObjectMatch = jsonObjectRegex.exec(text);
          if (jsonObjectMatch) {
            const repaired = repairMalformedJson(jsonObjectMatch[0]);
            if (repaired) {
              const parsed = JSON.parse(repaired);
              const validated = schema.parse(parsed);
              return validated as z.infer<typeof codeReviewSchema>;
            }
          }
        } catch (fallbackError) {
          console.error("Fallback strategy also failed:", fallbackError);
          // Continue to throw the original error
        }
      } else {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, 2 ** attempt * 1000),
        );
      }
    }
  }

  throw lastError || new Error("Failed to generate object after retries");
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
    // const doai = getDoAI();
    const model = openrouter("google/gemini-2.5-flash");
    const data = await generateObjectWithRetry({
      model,
      schema: codeReviewSchema,
      system: codeReviewSystemPrompt,
      prompt,
    });

    console.debug("Code review agent generated results:", data);

    const { error } = await context.supabase
      .from("projects")
      .update({
        description_accuracy_level: data.description_accuracy_level,
        description_accuracy_message: data.description_accuracy_message,
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
