"use client";

/**
 * useGeolocation.ts, hook de suivi de la position du festayre.
 *
 * Vie privee : la position ne quitte JAMAIS l'appareil. Elle sert
 * uniquement a calculer des distances en local, aucun envoi serveur.
 * watchPosition (et pas getCurrentPosition) : en feria on marche,
 * la liste des toilettes proches doit suivre le mouvement.
 */
import { useEffect, useState } from "react";
import type { LatLng } from "@/lib/geo";

export type GeolocationState = {
  position: LatLng | null;
  /** Message d'erreur pret a afficher, null si tout va bien. */
  error: string | null;
  loading: boolean;
};

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState({ position: null, error: "Géolocalisation non supportée.", loading: false });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) =>
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
          loading: false,
        }),
      (err) =>
        setState({
          position: null,
          error:
            err.code === err.PERMISSION_DENIED
              ? "Géolocalisation refusée : distances calculées depuis le centre de la féria."
              : "Position introuvable pour le moment.",
          loading: false,
        }),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
