import { createOpenAI } from "@ai-sdk/openai";

const DEFAULT_DO_AI_BASE_URL = "https://inference.do-ai.run/v1";
const DEFAULT_DO_AI_MODEL = "openai-gpt-oss-120b";

export function getDoAIModelName() {
  return process.env.DO_AI_MODEL?.trim() || DEFAULT_DO_AI_MODEL;
}

export function getDoAI() {
  const apiKey = process.env.DO_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing DO_AI_API_KEY. Set it in your environment (e.g. .env.local).",
    );
  }

  const baseURL = process.env.DO_AI_BASE_URL?.trim() || DEFAULT_DO_AI_BASE_URL;

  return createOpenAI({
    apiKey,
    baseURL,
  });
}
