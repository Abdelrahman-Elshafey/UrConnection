/**
 * The browser tab title for a page. React 19 moves a <title> rendered anywhere in a
 * component into <head> by itself, so a page just renders <title>{pageTitle("Profile")}</title>.
 * (It must be one string, so build it here rather than with JSX pieces.)
 */
export const pageTitle = (name?: string): string => (name ? `${name} · UrConnections` : "UrConnections");
