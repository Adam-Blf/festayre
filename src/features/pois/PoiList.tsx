"use client";

/**
 * PoiList.tsx, liste des POI tries du plus proche au plus loin.
 *
 * C'est l'ecran "urgence" : a 1h du matin on ne regarde pas une carte,
 * on veut la reponse en une ligne : "Toilettes, 120 m, par la".
 * Regle metier pour l'alcool : tri par niveau de prix D'ABORD
 * (supermarche avant epicerie de depannage), puis par distance.
 */
import { formatDistance, walkingDirectionsUrl } from "@/lib/geo";
import type { Poi, PoiCategory } from "./overpass";
import { TIER_LABELS } from "./overpass";

/** Libelles des onglets, dans l'ordre d'importance terrain. */
export const CATEGORY_TABS: { id: PoiCategory; label: string }[] = [
  { id: "toilets", label: "Toilettes" },
  { id: "booze", label: "Alcool pas cher" },
  { id: "water", label: "Eau gratuite" },
  { id: "transport", label: "Bus / navettes" },
  { id: "health", label: "Pharmacie" },
];

type Props = {
  pois: (Poi & { distanceM: number })[];
  category: PoiCategory;
};

export default function PoiList({ pois, category }: Props) {
  let items = pois.filter((p) => p.category === category);

  // Regle metier alcool : le moins cher d'abord, la distance departage.
  if (category === "booze") {
    items = [...items].sort(
      (a, b) => (a.priceTier ?? 3) - (b.priceTier ?? 3) || a.distanceM - b.distanceM
    );
  }

  if (items.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-muted">
        Rien de reference dans OpenStreetMap pour cette categorie ici.
        Pendant la feria, cherche aussi les urinoirs temporaires non
        cartographies.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-card-border">
      {items.slice(0, 40).map((poi) => (
        <li key={poi.id} className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{poi.name}</p>
            <p className="text-xs text-muted">
              {/* Niveau de prix (alcool) : le tier 1 est mis en avant. */}
              {poi.priceTier && (
                <span
                  className={poi.priceTier === 1 ? "font-bold text-festa-green" : ""}
                >
                  {TIER_LABELS[poi.priceTier]}
                  {" - "}
                </span>
              )}
              {poi.openingHours ?? (category === "booze" ? "horaires inconnus" : "")}
              {poi.fee === "no" && "Gratuites"}
              {poi.fee === "yes" && "Payantes"}
            </p>
          </div>
          <span className="shrink-0 text-sm font-bold text-festa-red">
            {formatDistance(poi.distanceM)}
          </span>
          <a
            href={walkingDirectionsUrl(poi)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Itineraire a pied vers ${poi.name}`}
            className="shrink-0 rounded-full bg-festa-red px-3 py-1.5 text-xs font-bold text-white"
          >
            Y aller
          </a>
        </li>
      ))}
    </ul>
  );
}
