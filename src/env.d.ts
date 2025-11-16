/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_CHARLITRON_FACEBOOK_URL?: string;
  readonly VITE_CHARLITRON_INSTAGRAM_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
