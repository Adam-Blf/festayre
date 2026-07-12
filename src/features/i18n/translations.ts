/**
 * translations.ts, dictionnaire FR / ES / EN du coeur touristique.
 *
 * Perimetre volontaire : la navigation de survie (onglets, categories
 * de POI, urgences, actions). San Fermin draine des hispanophones et
 * des anglophones, ils doivent trouver les toilettes aussi vite qu'un
 * Bayonnais. Le contenu editorial (programmes, ambiances) reste en
 * francais pour l'instant.
 *
 * Module pur : le test unitaire garantit qu'aucune cle ne manque dans
 * aucune langue (pas de trou d'i18n silencieux en prod).
 */

export const LANGS = ["fr", "es", "en"] as const;
export type Lang = (typeof LANGS)[number];

/** Toutes les cles traduisibles de l'app. */
export type I18nKey =
  | "tab.map"
  | "tab.list"
  | "tab.program"
  | "tab.infos"
  | "cat.toilets"
  | "cat.booze"
  | "cat.water"
  | "cat.transport"
  | "cat.shade"
  | "cat.health"
  | "action.go"
  | "action.directions"
  | "action.share"
  | "meet.set"
  | "meet.move"
  | "infos.bracelets"
  | "infos.shuttles"
  | "infos.emergency"
  | "infos.official"
  | "emergency.notalone"
  | "home.tagline";

const STRINGS: Record<I18nKey, Record<Lang, string>> = {
  "tab.map": { fr: "Carte", es: "Mapa", en: "Map" },
  "tab.list": { fr: "Liste", es: "Lista", en: "List" },
  "tab.program": { fr: "Programme", es: "Programa", en: "Program" },
  "tab.infos": { fr: "Infos", es: "Info", en: "Info" },
  "cat.toilets": { fr: "Toilettes", es: "Baños", en: "Toilets" },
  "cat.booze": { fr: "Alcool pas cher", es: "Alcohol barato", en: "Cheap drinks" },
  "cat.water": { fr: "Eau gratuite", es: "Agua gratis", en: "Free water" },
  "cat.transport": { fr: "Bus / navettes", es: "Bus / lanzaderas", en: "Bus / shuttles" },
  "cat.shade": { fr: "Ombre", es: "Sombra", en: "Shade" },
  "cat.health": { fr: "Pharmacie", es: "Farmacia", en: "Pharmacy" },
  "action.go": { fr: "Y aller", es: "Ir", en: "Go" },
  "action.directions": { fr: "Itinéraire à pied", es: "Ruta a pie", en: "Walking route" },
  "action.share": { fr: "Partager", es: "Compartir", en: "Share" },
  "meet.set": { fr: "Fixer le RDV ici", es: "Fijar el punto aquí", en: "Set meet point here" },
  "meet.move": { fr: "Déplacer le RDV ici", es: "Mover el punto aquí", en: "Move meet point here" },
  "infos.bracelets": { fr: "Bracelets / entrée", es: "Pulseras / entrada", en: "Wristbands / entry" },
  "infos.shuttles": { fr: "Bus et navettes", es: "Bus y lanzaderas", en: "Buses and shuttles" },
  "infos.emergency": { fr: "Urgences", es: "Emergencias", en: "Emergency" },
  "infos.official": { fr: "Site officiel de la féria", es: "Web oficial de la feria", en: "Official festival website" },
  "emergency.notalone": {
    fr: "Postes de secours signalés sur place. Ne laisse jamais un pote seul en vrac.",
    es: "Puestos de socorro señalizados. Nunca dejes solo a un amigo que está mal.",
    en: "First aid posts are signposted on site. Never leave a struggling friend alone.",
  },
  "home.tagline": {
    fr: "Les férias, directement dans votre poche.",
    es: "Las ferias, directamente en tu bolsillo.",
    en: "The férias, right in your pocket.",
  },
};

/** Traduit une cle, retombe sur le francais si besoin. */
export function t(key: I18nKey, lang: Lang): string {
  return STRINGS[key][lang] ?? STRINGS[key].fr;
}

/** Exporte le dictionnaire pour le test d'exhaustivite. */
export const ALL_STRINGS = STRINGS;
