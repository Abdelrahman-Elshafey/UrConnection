/// <reference types="vite/client" />

// Declares the VITE_* variables from web/.env so `import.meta.env.X` is typed.
// A ".d.ts" file contains only types: it never ends up in the bundle.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: string;
  readonly VITE_AUTH_REDIRECT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
