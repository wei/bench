import type { Enums, Tables } from "@/database.types";

// Type aliases for cleaner code
type Project = Tables<"projects">;
type ComplexityRating = Enums<"complexity_rating">;

interface PrizeResult {
  status: "valid" | "invalid";
  reason: string;
  confidence?: number;
}

const TECH_STACKS = [
  ["Next.js", "Supabase", "TailwindCSS"],
  ["React", "Firebase", "Material-UI"],
  ["Vue", "Node.js", "Express", "MongoDB"],
  ["Python", "Flask", "PostgreSQL"],
  ["React Native", "Expo", "Firebase"],
  ["Next.js", "OpenAI", "Vercel", "Prisma"],
];

const COMPLEXITIES: ComplexityRating[] = [
  "beginner",
  "intermediate",
  "advanced",
];

const PRIZE_CATEGORIES = [
  "best_use_of_ai",
  "best_healthcare_hack",
  "best_fintech_solution",
  "best_sustainability_hack",
  "best_design",
  "most_innovative",
];

export async function simulateCodeReview(
  _project: Project,
): Promise<Partial<Project>> {
  // Simulate 2 second processing
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const techStack = TECH_STACKS[Math.floor(Math.random() * TECH_STACKS.length)];
  const complexity =
    COMPLEXITIES[Math.floor(Math.random() * COMPLEXITIES.length)];

  return {
    tech_stack: techStack,
    technical_complexity: complexity,
  };
}

export async function simulatePrizeCategoryReview(
  _project: Project,
): Promise<Partial<Project>> {
  // Simulate 2 second processing
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const prizeResults: Record<string, PrizeResult> = {};

  // Randomly select 2-4 prize categories
  const numPrizes = 2 + Math.floor(Math.random() * 3);
  const selectedPrizes = PRIZE_CATEGORIES.toSorted(
    () => Math.random() - 0.5,
  ).slice(0, numPrizes);

  selectedPrizes.forEach((prize) => {
    const isValid = Math.random() > 0.3; // 70% chance of being valid
    prizeResults[prize] = {
      status: isValid ? "valid" : "invalid",
      reason: isValid
        ? `Project demonstrates strong application of ${prize.replaceAll("_", " ")}`
        : `Does not meet requirements for ${prize.replaceAll("_", " ")}`,
      confidence: 0.7 + Math.random() * 0.3,
    };
  });

  return {
    prize_results:
      prizeResults as unknown as Tables<"projects">["prize_results"],
  };
}
