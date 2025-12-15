/** biome-ignore-all lint/style/noNonNullAssertion: it's safe here */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = (
  cookieStore:
    | ReturnType<typeof cookies>
    | Promise<ReturnType<typeof cookies>> = cookies(),
) => {
  const cookieStorePromise = Promise.resolve(cookieStore);
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStorePromise.then((cookieStore) => cookieStore.getAll());
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              void cookieStorePromise.then((cookieStore) =>
                cookieStore.set(name, value, options),
              );
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};
