import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// One config for the whole monorepo; each block targets files by path.
export default defineConfig([
  globalIgnores(['**/dist', '**/node_modules', '**/.tmp']),

  // Base rules for every JS/TS file.
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [js.configs.recommended],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  },

  // TypeScript files: TS-aware rules (replace the JS versions of some rules).
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
  },

  // Browser React app.
  {
    files: ['web/src/**/*.{js,jsx,ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },

  // Unused variables: allow names starting with a capital or underscore
  // (components imported for JSX, intentionally unused args).
  {
    files: ['**/*.{js,jsx}'],
    rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }] },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },

  // Shared schemas get `z` from packages/shared/src/zod.ts (it configures zod for the CSP).
  {
    files: ['packages/shared/src/schemas/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: 'zod', message: 'Import { z } from "../zod" (configured for the CSP), not from "zod".', allowTypeImports: true }],
      }],
    },
  },

  // Config files, repo scripts and the API run in Node.
  {
    files: ['*.config.{js,ts}', 'web/*.config.{js,ts}', 'api/**/*.{js,ts}', 'scripts/**/*.js'],
    languageOptions: { globals: globals.node },
  },
])
