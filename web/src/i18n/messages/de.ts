import type { Messages } from "./en";

// German. Addresses the visitor with "du", matching the casual tone of the English texts.
export default {
  common: {
    returnHome: "Zur Startseite",
    cancel: "Abbrechen",
    loading: "Wird geladen",
  },
  fields: {
    country: "Land",
    city: "Stadt",
    optional: "{label} (optional)",
    selectCountry: "Land auswählen",
    selectCity: "Stadt auswählen",
    selectCountryFirst: "Zuerst ein Land auswählen",
    showPassword: "Passwort anzeigen",
    hidePassword: "Passwort verbergen",
  },
  nav: {
    profile: "Profil",
    signIn: "Anmelden",
    signOut: "Abmelden",
    goBack: "Zurück",
    // "Neue Gruppe": "Gruppe erstellen" next to "Anmelden" is too wide for a 390px phone.
    createGroup: "Neue Gruppe",
    loadingPage: "Seite wird geladen",
  },
  footer: {
    explore: "Entdecken",
    allGroups: "Alle Gruppen",
    createGroup: "Gruppe erstellen",
    tagline: "Eine Premium-Plattform für fokussierte Communities und berufliches Networking. Finde deine Leute, überall auf der Welt.",
    account: "Konto",
    profile: "Profil",
    signIn: "Anmelden",
    signOut: "Abmelden",
    register: "Registrieren",
    copyright: "Copyright © {year} UrConnections. Alle Rechte vorbehalten.",
    language: "Sprache",
  },
  notFound: {
    pageTitle: "Nicht gefunden",
    heading: "Nicht gefunden",
    noPage: "Unter dieser Adresse gibt es keine Seite.",
  },
  routeError: {
    updateTitle: "Update verfügbar",
    updateHeading: "Eine neue Version ist verfügbar",
    updateBody: "Die Website wurde aktualisiert, während diese Seite offen war. Lade sie neu, um die neueste Version zu bekommen.",
    errorTitle: "Etwas ist schiefgelaufen",
    errorHeading: "Etwas ist schiefgelaufen",
    errorBody: "Auf dieser Seite ist ein unerwarteter Fehler aufgetreten. Neu laden hilft meistens; falls nicht, geh zurück zur Startseite.",
    reload: "Seite neu laden",
  },
} satisfies Messages;
