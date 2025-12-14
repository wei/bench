import { ProjectsList } from "@/components/projects-list";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Bench
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Hackathon project management and judging platform
          </p>
        </div>

        <ProjectsList />
      </main>
    </div>
  );
}
