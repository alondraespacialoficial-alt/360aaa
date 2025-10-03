// env.ts
export const env = {
  VITE_SUPABASE_URL: (globalThis as any).VITE_SUPABASE_URL || "",
  VITE_SUPABASE_ANON_KEY: (globalThis as any).VITE_SUPABASE_ANON_KEY || ""
};
