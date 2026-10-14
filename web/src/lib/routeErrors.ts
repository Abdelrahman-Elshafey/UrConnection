/**
 * True when a lazy page's JavaScript file couldn't be downloaded. The usual cause: a new
 * version was deployed while this tab was open, so the old chunk file names no longer exist
 * on the server. Reloading fetches the new index.html with the new names.
 * Each browser words this differently, so the check matches the three known messages.
 */
export function isChunkLoadError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(error.message)
  );
}
