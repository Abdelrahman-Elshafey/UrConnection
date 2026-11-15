import type { Topic } from "@urconnections/shared";

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
  // Labels for the topic values (the values themselves stay English: URL, API, DB).
  topics: {
    All: "All",
    Programming: "Programming",
    Language: "Language",
    Math: "Math",
    Science: "Science",
    Design: "Design",
    Business: "Business",
    Art: "Art",
  } satisfies Record<Topic | "All", string>,
  groups: {
    connect: "Connect now",
    list: {
      pageSpinner: "Initializing Experience",
      exploreTopic: "Explore {topic}",
      exploreFeatured: "Explore Featured",
      // Singular/plural pair, read with tn() (useT). {count} may be "20+".
      available_one: "{count} group available in your network",
      available_other: "{count} groups available in your network",
      detecting: "Detecting Location",
      clearAll: "Clear all",
      retry: "Retry Connection",
      emptyTitle: "No groups found.",
      emptyBody: "Refine your discovery parameters or expand your search to global locations.",
      resetFilters: "Reset Filters",
      loadingMore: "Loading…",
      loadMore: "Load more",
    },
    filters: {
      heroLead: "Find your",
      // Shown huge (PageHero): a translation must fit a 390px phone (about 12 characters).
      heroAccent: "Connections.",
      heroIntro: "Discover elite communities focused on growth, learning, and local networking.",
      searchLabel: "Search groups",
      searchPlaceholder: "Find your group by Interest",
      search: "Search",
      platform: "Platform",
      topic: "Topic",
      global: "Global",
      allCities: "All Cities",
      allPlatforms: "All Platforms",
    },
    card: {
      delete: "Delete {title}",
      edit: "Edit {title}",
      viewDetails: "View Details",
    },
    detail: {
      loading: "Loading Detail",
      back: "Back to Explore",
      description: "Description",
      location: "Location",
      global: "Global Network",
      platform: "Access Platform",
      edit: "Edit Group",
      delete: "Delete Group",
    },
    deleteDialog: {
      title: "Delete this group?",
      confirm: "Delete",
      // Shown after the group's title, which is printed in bold in front of it.
      body: "will be removed for everyone. This can't be undone.",
      deleted: "\"{title}\" was deleted.",
    },
    form: {
      cancel: "Cancel and Return",
      heroAccent: "Community.",
      topic: "Field of Interest",
      selectTopic: "Select category",
      title: "Group Name",
      titlePlaceholder: "e.g. Design Collective",
      country: "Network Location",
      city: "Specific City",
      platform: "Meeting Platform",
      selectPlatform: "Select platform",
      link: "Group Link",
      selectPlatformFirst: "Select a platform first",
      description: "Group Description",
      descriptionPlaceholder: "What is the objective of this connection?",
      descriptionHint: "20 to 200 characters.",
    },
    create: {
      tabTitle: "Create a group",
      heroLead: "Launch your",
      intro: "Design a premium environment for focused growth and meaningful connections.",
      submit: "Launch Channel",
      // "Resend email" must match auth.verifyBanner's button text in each language (step 5).
      unverified: "Please confirm your email address first: open the link we emailed you (or use \"Resend email\" above), then come back.",
    },
    edit: {
      notOwner: "You can only edit groups you created.",
      tabTitle: "Edit group",
      heroLead: "Edit your",
      intro: "Update how your group is described. The platform and link stay as they are.",
      submit: "Save Changes",
      linkHint: "The link and platform can't be changed. To use another link, create a new group.",
    },
  },
  profile: {
    page: {
      tabTitle: "Your profile",
      heroLead: "Your",
      heroAccent: "Profile.",
      intro: "Manage your account details and view the communities you've launched.",
      accountTitle: "Account Information",
      accountIntro: "Your personal details and contact information. Manage how you appear to others.",
      groupsTitle: "Your Groups",
      groupsHeading: "Communities you lead.",
      empty: "You haven't created any groups yet.",
      emptyCta: "Launch your first channel",
    },
    details: {
      displayName: "Display Name",
      email: "Email Address",
      phone: "Phone Number",
      location: "Location",
      notSet: "Not set",
      edit: "Edit Profile",
      emailHint: "Email cannot be changed from here.",
      // Example values in the empty fields: a typical name and phone number for each language.
      displayNamePlaceholder: "Jane Doe",
      phonePlaceholder: "+1 234 567 8900",
      saving: "Saving…",
      save: "Save Changes",
      updated: "Profile updated.",
    },
    avatar: {
      change: "Change profile picture",
      remove: "Remove",
      wrongType: "Please choose a JPEG, PNG or WebP image.",
      tooLarge: "That image is too large. The maximum is 5 MB.",
      updated: "Picture updated.",
      removed: "Picture removed.",
    },
  },
};

/**
 * The shape every language must have: the same nested keys, each a string. (No `as const`
 * above on purpose: then the values are typed `string`, not the exact English sentences,
 * so a translation fits the type.)
 */
export type Messages = typeof en;
