/**
 * Every text on the website, in English. This file is the source of truth: add a text here
 * first, then translate it in it.ts, de.ts and fr.ts. TypeScript refuses to build if a
 * translation is missing a key or has one that doesn't exist here (`satisfies Messages`).
 *
 * Texts are grouped by where they appear (nav, footer, ...). Components read them with
 * t("footer.allGroups"). `{name}` placeholders are filled in by t(key, { name: ... }).
 *
 * Only what people *see* is translated. Values stored in the database and checked by the
 * API (topics, country names, platform keys) stay in English.
 */
export const en = {
  common: {
    returnHome: "Return Home",
    cancel: "Cancel",
    loading: "Loading",
  },
  // Form fields of the UI kit (components/ui). Pages pass their own labels.
  fields: {
    country: "Country",
    city: "City",
    optional: "{label} (optional)",
    selectCountry: "Select country",
    selectCity: "Select city",
    selectCountryFirst: "Select a country first",
    showPassword: "Show password",
    hidePassword: "Hide password",
  },
  nav: {
    profile: "Profile",
    signIn: "Sign In",
    signOut: "Sign Out",
    goBack: "Go Back",
    // Keep translations about this short: on a 390px phone the navbar has room for
    // "Sign In" + this button and little more. (The footer's createGroup has more room.)
    createGroup: "Create Group",
    loadingPage: "Loading page",
  },
  footer: {
    explore: "Explore",
    allGroups: "All Groups",
    createGroup: "Create a Group",
    tagline: "A premium platform for focused communities and professional networking. Find your tribe, anywhere in the world.",
    account: "Account",
    profile: "Profile",
    signIn: "Sign In",
    signOut: "Sign Out",
    register: "Register",
    copyright: "Copyright © {year} UrConnections. All rights reserved.",
    language: "Language",
  },
  notFound: {
    pageTitle: "Not found",
    heading: "Not Found",
    noPage: "There's no page at this address.",
  },
  routeError: {
    updateTitle: "Update available",
    updateHeading: "A new version is available",
    updateBody: "The site was updated while this page was open. Reload to get the latest version.",
    errorTitle: "Something went wrong",
    errorHeading: "Something went wrong",
    errorBody: "This page hit an unexpected error. Reloading usually helps; if it doesn't, go back home.",
    reload: "Reload page",
  },
};

/**
 * The shape every language must have: the same nested keys, each a string. (No `as const`
 * above on purpose: then the values are typed `string`, not the exact English sentences,
 * so a translation fits the type.)
 */
export type Messages = typeof en;
