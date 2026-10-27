/// <reference types="vite/client" />

// Types for Vite features (import.meta.env, asset imports). A ".d.ts" file contains only
// types: it never ends up in the bundle. No VITE_* variables are used today (every setting
// lives in api/.env); to add one, declare `interface ImportMetaEnv { readonly VITE_X: string }`.
