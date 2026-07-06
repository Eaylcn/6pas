/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase proje URL'i — verilirse ONLINE mod açılır */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon (public) anahtarı */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
