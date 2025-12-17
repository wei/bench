import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BenchLogo } from "@/components/icons/bench-logo";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in | Bench",
};

interface LoginPageProps {
  readonly searchParams?: Promise<{ error?: string }>;
}

export default async function LoginPage(props: LoginPageProps) {
  const searchParams = await props.searchParams;
  const session = await getSession();

  if (session) {
    redirect("/events");
  }

  const error = searchParams?.error;

  const errorMessage =
    error === "missing_code"
      ? "We didn’t receive a code back from MyMLH. Try signing in again."
      : error === "state_mismatch"
        ? "Login failed: security check didn’t match. Please retry."
        : error === "token_exchange_failed"
          ? "Unable to exchange the code for a token."
          : error === "profile_fetch_failed"
            ? "Could not load your MyMLH profile."
            : error === "no_access_token"
              ? "No access token returned from MyMLH."
              : error
                ? "We couldn’t complete login. Please try again."
                : undefined;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.4] pointer-events-none bg-[radial-gradient(circle_at_20%_20%,#fef3c7,transparent_30%),radial-gradient(circle_at_80%_0%,#fee2e2,transparent_25%),radial-gradient(circle_at_50%_90%,#e0f2fe,transparent_25%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:120px_120px]" />

      <div className="relative max-w-5xl mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8 items-center justify-center min-h-screen">
        <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-md p-8 lg:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-md bg-(--mlh-dark-grey)/5 p-2 text-(--mlh-dark-grey)">
              <BenchLogo className="w-10 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-gray-500">
                Bench
              </p>
              <h1 className="text-2xl font-bold text-gray-900">
                Hackathon judging, organized.
              </h1>
            </div>
          </div>

          <p className="text-gray-600 leading-relaxed">
            Sign in with MyMLH to access events, review projects, and keep your
            judging in sync. Clean, simple, and built for teams on a deadline.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="font-semibold text-gray-900">Realtime updates</p>
              <p className="text-gray-600">
                Projects, scores, and reviews stay current while you work.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="font-semibold text-gray-900">Judge-friendly</p>
              <p className="text-gray-600">
                Fast navigation with focused project views.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-lg p-8 lg:p-10 translate-y-2 lg:translate-y-0">
          <div className="flex flex-col gap-2 mb-6">
            <div className="text-xs font-semibold text-(--mlh-red)">
              MyMLH Login
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Sign in to Bench
            </h2>
            <p className="text-gray-600">
              Continue with your MyMLH account to access judging.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {errorMessage}
            </div>
          )}

          <form action="/api/auth/login" method="get" className="space-y-4">
            <Button
              type="submit"
              className="w-full text-base h-11 bg-(--mlh-red) hover:bg-(--mlh-red)/90"
            >
              Continue with MyMLH
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
            <p>You must be logged in to access Bench.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
