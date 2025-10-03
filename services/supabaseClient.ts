import { createClient } from "@supabase/supabase-js";

const url = (globalThis as any).VITE_SUPABASE_URL;
const anon = (globalThis as any).VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error("Supabase env missing (URL/KEY)");
}

export const supabase = createClient(url, anon);