import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/database.types";

export async function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
