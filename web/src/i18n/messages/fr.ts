import type { Messages } from "./en";

// French. Addresses the visitor with "vous", the usual tone for French websites.
// French puts a (non-breaking) space before ; : ! ? — written here as "\u00a0" so the
// punctuation never wraps onto a line of its own.
export default {
  common: {
    returnHome: "Retour à l'accueil",
  },
  nav: {
    profile: "Profil",
    signIn: "Connexion",
    signOut: "Déconnexion",
    goBack: "Retour",
    // Just "Créer": "Créer un groupe" next to "Connexion" is too wide for a 390px phone.
    // The footer, which has room, keeps the full "Créer un groupe".
    createGroup: "Créer",
    loadingPage: "Chargement de la page",
  },
  footer: {
    explore: "Explorer",
    allGroups: "Tous les groupes",
    createGroup: "Créer un groupe",
    tagline: "Une plateforme premium pour des communautés ciblées et le réseautage professionnel. Trouvez votre tribu, partout dans le monde.",
    account: "Compte",
    profile: "Profil",
    signIn: "Connexion",
    signOut: "Déconnexion",
    register: "S'inscrire",
    copyright: "Copyright © {year} UrConnections. Tous droits réservés.",
    language: "Langue",
  },
  notFound: {
    pageTitle: "Introuvable",
    heading: "Introuvable",
    noPage: "Il n'y a aucune page à cette adresse.",
  },
  routeError: {
    updateTitle: "Mise à jour disponible",
    updateHeading: "Une nouvelle version est disponible",
    updateBody: "Le site a été mis à jour pendant que cette page était ouverte. Rechargez-la pour obtenir la dernière version.",
    errorTitle: "Une erreur est survenue",
    errorHeading: "Une erreur est survenue",
    errorBody: "Cette page a rencontré une erreur inattendue. Recharger suffit généralement\u00a0; sinon, revenez à l'accueil.",
    reload: "Recharger la page",
  },
} satisfies Messages;
