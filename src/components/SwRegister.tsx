"use client";

/**
 * SwRegister.tsx, enregistre le service worker cote navigateur.
 * Composant invisible monte une seule fois dans le layout racine.
 * On n'enregistre qu'en production : en dev le SW mettrait en cache
 * les bundles de dev et rendrait le hot-reload incomprehensible.
 */
import { useEffect } from "react";

export default function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Echec silencieux : l'app fonctionne aussi sans offline.
    });
  }, []);
  return null;
}
