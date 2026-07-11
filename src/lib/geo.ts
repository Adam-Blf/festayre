/**
 * geo.ts, boite a outils geographique pure (aucune dependance).
 *
 * Point de vue metier : pendant une feria, la seule question qui compte
 * est "c'est a combien de metres A PIED ?". Toutes les distances de
 * l'application passent par ce module pour garantir un calcul coherent.
 */

/** Coordonnee GPS simple (latitude / longitude en degres decimaux). */
export type LatLng = {
  lat: number;
  lng: number;
};

/** Rayon moyen de la Terre en metres (norme WGS-84 simplifiee). */
const EARTH_RADIUS_M = 6_371_000;

/** Conversion degres vers radians. */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Distance "a vol d'oiseau" entre deux points GPS, en metres.
 *
 * Formule de Haversine : precision largement suffisante a l'echelle
 * d'une ville en fete (erreur < 0,5 % sur quelques kilometres).
 */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Formate une distance pour l'affichage utilisateur.
 * En dessous d'un kilometre on parle en metres (arrondis a 10 m pres,
 * inutile d'etre plus precis qu'un GPS de telephone), au dessus en km
 * avec une decimale, format francais (virgule).
 */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "?";
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

/**
 * Trie une liste d'objets geolocalises du plus proche au plus lointain
 * par rapport a un point de reference (l'utilisateur, ou le centre de
 * la feria si la geolocalisation est refusee).
 * Retourne une NOUVELLE liste, l'originale n'est pas modifiee.
 */
export function sortByDistance<T extends LatLng>(items: T[], from: LatLng): (T & { distanceM: number })[] {
  return items
    .map((item) => ({ ...item, distanceM: haversineMeters(from, item) }))
    .sort((a, b) => a.distanceM - b.distanceM);
}

/**
 * Lien Google Maps "itineraire a pied" vers un point.
 * On delegue la navigation fine a Google Maps plutot que de la
 * re-implementer : en pleine feria les rues sont fermees et seul un
 * vrai moteur d'itineraires est fiable.
 */
export function walkingDirectionsUrl(to: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lng}&travelmode=walking`;
}
