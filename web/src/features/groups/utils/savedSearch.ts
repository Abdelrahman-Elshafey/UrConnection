// Remembers the home page's last search string (e.g. "?topic=Math&country=Egypt") for
// this browser tab, so clicking the logo returns to the same results.
// The URL stays the single source of truth; this is only a bookmark of it (audit O1).
// An empty string is meaningful: "the user cleared the filters", so the location
// preset must not come back (audit B29). `null` means "nothing saved yet".

const KEY = "uc_home_search";

export function readSavedSearch(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null; // storage blocked (private mode, settings): behave as "nothing saved"
  }
}

export function saveSearch(search: string): void {
  try {
    sessionStorage.setItem(KEY, search);
  } catch {
    // ignore: losing this bookmark is harmless
  }
}

/** Forget the saved search (on sign-in / sign-out, so the next person starts fresh). */
export function clearSavedSearch(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
