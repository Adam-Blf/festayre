"use client";

/**
 * FeriaMap.tsx, la carte Leaflet d'une feria.
 *
 * Charge UNIQUEMENT cote navigateur (dynamic import ssr:false dans la
 * page) car Leaflet manipule window. Fond de carte OpenStreetMap,
 * gratuit et sans cle.
 *
 * Choix cartographique : des CircleMarker colores par categorie metier
 * plutot que des icones images, lisibles, legers et sans probleme
 * d'assets Leaflet.
 */
import { MapContainer, TileLayer, CircleMarker, Marker, Popup } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/lib/geo";
import { formatDistance, walkingDirectionsUrl } from "@/lib/geo";
import type { Poi, PoiCategory } from "@/features/pois/overpass";
import { TIER_LABELS } from "@/features/pois/overpass";

/** Couleur de marqueur par categorie metier. */
const CATEGORY_COLORS: Record<PoiCategory, string> = {
  toilets: "#7c3aed", // violet, visible sur tous les fonds
  booze: "#b80c1d",   // rouge foulard officiel
  water: "#0284c7",   // bleu eau
  health: "#059669",  // vert croix de pharmacie
  transport: "#d97706", // orange bus de nuit
};

/** Pastille bleue "vous etes ici" (divIcon CSS, pas d'image). */
const userIcon = divIcon({
  className: "",
  html: '<div class="user-dot"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

type Props = {
  center: LatLng;
  userPosition: LatLng | null;
  pois: (Poi & { distanceM: number })[];
};

export default function FeriaMap({ center, userPosition, pois }: Props) {
  // La carte s'ouvre sur l'utilisateur s'il est localise, sinon sur
  // le coeur de la feria.
  const mapCenter = userPosition ?? center;

  return (
    <MapContainer
      center={[mapCenter.lat, mapCenter.lng]}
      zoom={16}
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Position du festayre. */}
      {userPosition && (
        <Marker position={[userPosition.lat, userPosition.lng]} icon={userIcon}>
          <Popup>Tu es ici (enfin, ton téléphone).</Popup>
        </Marker>
      )}

      {/* Tous les POI, colores par categorie. */}
      {pois.map((poi) => (
        <CircleMarker
          key={poi.id}
          center={[poi.lat, poi.lng]}
          radius={8}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: CATEGORY_COLORS[poi.category],
            fillOpacity: 0.95,
          }}
        >
          <Popup>
            <strong>{poi.name}</strong>
            <br />
            {formatDistance(poi.distanceM)}
            {poi.priceTier && (
              <>
                <br />
                {TIER_LABELS[poi.priceTier]}
              </>
            )}
            {poi.openingHours && (
              <>
                <br />
                <span style={{ fontSize: 11 }}>{poi.openingHours}</span>
              </>
            )}
            <br />
            <a href={walkingDirectionsUrl(poi)} target="_blank" rel="noopener noreferrer">
              Itinéraire à pied
            </a>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
