"use client";

import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth/session";

interface SessionResponse {
  authenticated: boolean;
  user?: SessionUser;
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = (await res.json()) as SessionResponse;
        if (isMounted && data.authenticated && data.user) {
          setUser(data.user);
        }
      } catch {
        setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  return { user, isLoading };
}
