"use client";

/**
 * useMeetPoint.ts, le point de rendez-vous du groupe.
 *
 * Besoin terrain n. 1 : le groupe se perd dans la foule et personne
 * ne se souvient du point de RDV. On l'epingle UNE fois sur la carte,
 * il reste en localStorage (par feria) et se partage en un tap via
 * un lien Google Maps (fonctionne meme pour les potes sans l'app).
 */
import { useCallback, useEffect, useState } from "react";
import type { LatLng } from "@/lib/geo";

const KEY_PREFIX = "festayre.meetpoint.";

export function useMeetPoint(feriaId: string) {
  const [point, setPoint] = useState<LatLng | null>(null);

  // Lecture au montage (par feria : le RDV de Dax n'est pas celui de Bayonne).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY_PREFIX + feriaId);
      setPoint(raw ? (JSON.parse(raw) as LatLng) : null);
    } catch {
      setPoint(null);
    }
  }, [feriaId]);

  /** Fixe le RDV (position actuelle du festayre en general). */
  const setMeetPoint = useCallback(
    (p: LatLng) => {
      setPoint(p);
      localStorage.setItem(KEY_PREFIX + feriaId, JSON.stringify(p));
    },
    [feriaId]
  );

  const clearMeetPoint = useCallback(() => {
    setPoint(null);
    localStorage.removeItem(KEY_PREFIX + feriaId);
  }, [feriaId]);

  /**
   * Partage le RDV au groupe : Web Share API si dispo (WhatsApp,
   * SMS, etc.), sinon copie du lien dans le presse-papier.
   * Retourne le message affiche a l'utilisateur.
   */
  const shareMeetPoint = useCallback(async (): Promise<string> => {
    if (!point) return "Aucun RDV fixé.";
    const url = `https://www.google.com/maps?q=${point.lat},${point.lng}`;
    const text = `Point de RDV du groupe : ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "RDV Festayre", text, url });
        return "RDV partagé.";
      }
      await navigator.clipboard.writeText(text);
      return "Lien du RDV copié, colle-le dans le groupe.";
    } catch {
      return "Partage annulé.";
    }
  }, [point]);

  return { point, setMeetPoint, clearMeetPoint, shareMeetPoint };
}
