import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BenchLogo } from "@/components/icons/bench-logo";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in | Bench",
};

export const dynamic = "force-dynamic";

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
      ? "We didn't receive a code back from MyMLH. Try signing in again."
      : error === "state_mismatch"
        ? "Login failed: security check didn't match. Please retry."
        : error === "token_exchange_failed"
          ? "Unable to exchange the code for a token."
          : error === "profile_fetch_failed"
            ? "Could not load your MyMLH profile."
            : error === "no_access_token"
              ? "No access token returned from MyMLH."
              : error
                ? "We couldn't complete login. Please try again."
                : undefined;

  const playfulBench = Math.random() < 0.2;
  const brandName = playfulBench ? "Benches" : "Bench";
  const brandColorClass = playfulBench
    ? "text-(--mlh-red)"
    : "text-(--mlh-dark-grey) dark:text-(--mlh-white)";

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="hidden border-border/70 bg-card/60 lg:block lg:border-r">
          <div className="flex h-full flex-col justify-between p-12">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Built for hackathons
              </p>
              <p className="text-2xl font-semibold text-foreground">
                Keep scoring calm and consistent.
              </p>
              <p className="text-sm text-muted-foreground">
                Bench keeps judges, submissions, and decisions aligned with a
                single sign in.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-12 p-8 sm:p-12 lg:order-2 lg:p-16">
          <div className="flex items-center gap-3">
            <BenchLogo className={`w-8 h-4 ${brandColorClass}`} />
            <h1
              className={`text-2xl font-bold font-headline ${brandColorClass}`}
            >
              {brandName}
            </h1>
          </div>

          <div className="flex flex-1 items-center">
            <div className="w-full max-w-md space-y-8">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Sign in to Bench
                </h1>
                <p className="text-sm text-muted-foreground">
                  One step to access events and review projects.
                </p>
              </div>

              {errorMessage && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-900">
                  {errorMessage}
                </div>
              )}

              <form action="/api/auth/login" method="get" className="space-y-4">
                <Button
                  type="submit"
                  className="h-11 w-full bg-(--mlh-blue) text-base font-semibold text-white transition hover:bg-(--mlh-blue)/85"
                >
                  Continue with MyMLH
                </Button>
              </form>

              <p className="text-xs text-muted-foreground">
                You must be logged in to access Bench.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
