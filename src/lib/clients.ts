import { type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { config } from "./config";
import type { Database } from "../types/database";

export const supabase: SupabaseClient<Database> = createBrowserClient<Database>(
  config.supabase.url,
  config.supabase.anonKey
);

export function createServerSupabaseClient(context: {
  req?: Request;
  res?: Response;
  cookies?: {
    getAll: () => Array<{ name: string; value: string }>;
    set: (
      name: string,
      value: string,
      options?: Record<string, unknown>
    ) => void;
  };
}) {
  return createServerClient<Database>(
    config.supabase.url,
    config.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return context.cookies?.getAll() ?? [];
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            context.cookies?.set(name, value, options);
          });
        },
      },
    }
  );
}
