import type { Messages } from "./en";

// Italian. Addresses the visitor with "tu", the usual tone for websites like this one.
export default {
  common: {
    returnHome: "Torna alla home",
  },
  nav: {
    profile: "Profilo",
    signIn: "Accedi",
    signOut: "Esci",
    goBack: "Indietro",
    createGroup: "Crea gruppo",
    loadingPage: "Caricamento pagina",
  },
  footer: {
    explore: "Esplora",
    allGroups: "Tutti i gruppi",
    createGroup: "Crea un gruppo",
    tagline: "Una piattaforma premium per community mirate e networking professionale. Trova la tua tribù, ovunque nel mondo.",
    account: "Account",
    profile: "Profilo",
    signIn: "Accedi",
    signOut: "Esci",
    register: "Registrati",
    copyright: "Copyright © {year} UrConnections. Tutti i diritti riservati.",
    language: "Lingua",
  },
  notFound: {
    pageTitle: "Non trovato",
    heading: "Non trovato",
    noPage: "Non c'è nessuna pagina a questo indirizzo.",
  },
  routeError: {
    updateTitle: "Aggiornamento disponibile",
    updateHeading: "È disponibile una nuova versione",
    updateBody: "Il sito è stato aggiornato mentre questa pagina era aperta. Ricarica per avere la versione più recente.",
    errorTitle: "Qualcosa è andato storto",
    errorHeading: "Qualcosa è andato storto",
    errorBody: "Questa pagina ha riscontrato un errore imprevisto. Di solito basta ricaricare; altrimenti torna alla home.",
    reload: "Ricarica la pagina",
  },
} satisfies Messages;
