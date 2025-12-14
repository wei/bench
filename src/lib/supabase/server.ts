import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/database.types";

export async function createClient() {
  return createSupabaseClient<Database>(
    // biome-ignore lint/style/noNonNullAssertion: it's safe here
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // biome-ignore lint/style/noNonNullAssertion: it's safe here
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
