/**
 * overpass.ts, acces aux points d'interet (POI) via l'API Overpass
 * d'OpenStreetMap. Gratuit, sans cle, donnees communautaires.
 *
 * Point de vue metier, un festayre a 4 besoins vitaux :
 *  1. "toilets" : les toilettes les plus proches (LA feature n. 1)
 *  2. "booze"   : ou acheter l'alcool le moins cher (supermarche >
 *                 cave a boissons > epicerie de depannage qui gonfle
 *                 ses prix a 2h du matin)
 *  3. "water"   : points d'eau potable gratuits (survie + hangover)
 *  4. "health"  : pharmacies et hopitaux si la nuit tourne mal
 *
 * Les fonctions de construction de requete et de parsing sont pures
 * (testables sans reseau), seule fetchPois touche le reseau.
 */
import type { LatLng } from "@/lib/geo";

/** Les 5 familles de POI du domaine festayre. */
export type PoiCategory = "toilets" | "booze" | "water" | "health" | "transport";

/**
 * Niveau de prix pour l'alcool, deduit du type de commerce OSM :
 * 1 = supermarche (le moins cher), 2 = cave / magasin de boissons,
 * 3 = superette / epicerie de depannage (le plus cher).
 */
export type PriceTier = 1 | 2 | 3;

/** Un point d'interet normalise, pret pour la carte et la liste. */
export type Poi = {
  id: string;
  category: PoiCategory;
  name: string;
  lat: number;
  lng: number;
  priceTier?: PriceTier;
  /** Horaires bruts OSM si renseignes (ex : "Mo-Sa 08:30-20:00"). */
  openingHours?: string;
  /** Payant / gratuit pour les toilettes, si l'info existe. */
  fee?: string;
};

/** Miroirs Overpass publics, essayes dans l'ordre en cas de panne. */
const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

/** Types de commerces OSM consideres comme vendeurs d'alcool a emporter. */
const BOOZE_SHOPS = ["supermarket", "convenience", "alcohol", "beverages", "wine"];

/**
 * Construit la requete Overpass QL : tous les POI utiles dans un rayon
 * donne autour du centre de la feria. Une seule requete reseau pour
 * les 4 categories, on economise la batterie du festayre.
 */
export function buildOverpassQuery(center: LatLng, radiusM: number): string {
  const around = `(around:${radiusM},${center.lat},${center.lng})`;
  const shopRegex = `^(${BOOZE_SHOPS.join("|")})$`;
  return `
[out:json][timeout:25];
(
  nwr["amenity"="toilets"]${around};
  nwr["amenity"="drinking_water"]${around};
  nwr["shop"~"${shopRegex}"]${around};
  nwr["amenity"~"^(pharmacy|hospital)$"]${around};
  node["highway"="bus_stop"]${around};
  nwr["amenity"="bus_station"]${around};
);
out center tags;`.trim();
}

/** Element brut renvoye par Overpass (sous-ensemble utile). */
export type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  /** Pour les ways/relations, Overpass renvoie le centroide ici. */
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

/**
 * Deduit le niveau de prix alcool depuis le tag shop OSM.
 * Logique terrain : le supermarche casse les prix, la cave est correcte,
 * l'epicerie ouverte a 3h du matin se paie sur la marge.
 */
export function boozeTier(shop: string): PriceTier {
  if (shop === "supermarket") return 1;
  if (shop === "alcohol" || shop === "beverages" || shop === "wine") return 2;
  return 3; // convenience et le reste
}

/** Libelle metier des niveaux de prix, affiche dans l'UI. */
export const TIER_LABELS: Record<PriceTier, string> = {
  1: "Prix supermarché",
  2: "Prix cave / boissons",
  3: "Prix dépannage",
};

/** Classe un element OSM dans une de nos 4 categories metier. */
function categorize(tags: Record<string, string>): PoiCategory | null {
  if (tags.amenity === "toilets") return "toilets";
  if (tags.amenity === "drinking_water") return "water";
  if (tags.amenity === "pharmacy" || tags.amenity === "hospital") return "health";
  if (tags.shop && BOOZE_SHOPS.includes(tags.shop)) return "booze";
  // Arrets de bus et gares routieres : vital pour les navettes de nuit.
  if (tags.highway === "bus_stop" || tags.amenity === "bus_station") return "transport";
  return null;
}

/** Nom lisible : enseigne si connue, sinon libelle generique metier. */
function displayName(tags: Record<string, string>, category: PoiCategory): string {
  if (tags.name) return tags.name;
  if (tags.brand) return tags.brand;
  switch (category) {
    case "toilets":
      return "Toilettes publiques";
    case "water":
      return "Point d'eau potable";
    case "health":
      return tags.amenity === "hospital" ? "Hôpital" : "Pharmacie";
    case "booze":
      return "Commerce de boissons";
    case "transport":
      return tags.amenity === "bus_station" ? "Gare routière" : "Arrêt de bus";
  }
}

/**
 * Transforme la reponse JSON Overpass en liste de Poi normalises.
 * Fonction pure : c'est elle qui est couverte par les tests unitaires.
 */
export function parseOverpassResponse(json: { elements?: OverpassElement[] }): Poi[] {
  const pois: Poi[] = [];
  for (const el of json.elements ?? []) {
    const tags = el.tags ?? {};
    const category = categorize(tags);
    if (!category) continue;

    // Un node a lat/lon directs, un way/relation a un centroide "center".
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat === undefined || lng === undefined) continue;

    pois.push({
      id: `${el.type}/${el.id}`,
      category,
      name: displayName(tags, category),
      lat,
      lng,
      priceTier: category === "booze" && tags.shop ? boozeTier(tags.shop) : undefined,
      openingHours: tags.opening_hours,
      fee: tags.fee,
    });
  }
  return pois;
}

/**
 * Recupere les POI autour d'une feria, avec bascule automatique sur
 * le miroir suivant si un serveur Overpass est sature (frequent les
 * week-ends de fete).
 */
export async function fetchPois(center: LatLng, radiusM = 4000): Promise<Poi[]> {
  const query = buildOverpassQuery(center, radiusM);
  let lastError: unknown;

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(mirror, {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
      return parseOverpassResponse(await res.json());
    } catch (err) {
      lastError = err;
      // On tente le miroir suivant avant d'abandonner.
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Overpass indisponible");
}
