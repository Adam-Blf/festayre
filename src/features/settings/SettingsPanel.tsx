"use client";

/**
 * SettingsPanel.tsx, reglages locaux.
 *
 * Tout ce que l'app stocke sur CE telephone est effacable ici en un
 * bouton (checklist, RDV, passeport, contacts SAM, onboarding).
 * Transparence totale : on liste ce qui est stocke avant d'effacer.
 */
import { useState } from "react";

/** Prefixes localStorage utilises par l'app, pour l'effacement cible. */
const LOCAL_PREFIXES = [
  "festayre.checklist",
  "festayre.meetpoint",
  "festayre.sam",
  "festayre.passport",
  "festayre.onboarded",
];

export default function SettingsPanel() {
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const wipeLocal = () => {
    // On ne supprime QUE nos cles, pas tout le localStorage du domaine.
    for (const key of Object.keys(localStorage)) {
      if (LOCAL_PREFIXES.some((p) => key.startsWith(p))) {
        localStorage.removeItem(key);
      }
    }
    setDone(true);
    setConfirm(false);
  };

  return (
    <section className="rounded-xl border border-card-border bg-card p-4 text-sm">
      <h2 className="display text-lg text-festa-red">Mes données locales</h2>
      <p className="mt-1 text-muted">
        Checklist, point de RDV, contacts SAM, passeport et tampons vivent
        uniquement sur ce téléphone. Ta position GPS n&apos;est jamais
        envoyée à un serveur Festayre.
      </p>

      {done ? (
        <p className="mt-3 font-semibold text-festa-green">
          Données locales effacées.
        </p>
      ) : confirm ? (
        <div className="mt-3 flex gap-2">
          <button
            onClick={wipeLocal}
            className="min-h-11 flex-1 rounded-lg bg-festa-red text-xs font-bold text-white"
          >
            Confirmer l&apos;effacement
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="min-h-11 flex-1 rounded-lg border border-card-border text-xs font-bold"
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirm(true)}
          className="mt-3 min-h-11 w-full rounded-lg border border-festa-red/40 text-xs font-bold text-festa-red"
        >
          Effacer mes données locales
        </button>
      )}

      <p className="mt-3 text-xs text-muted">
        Compte et données communauté : gestion et suppression depuis{" "}
        <a href="/compte" className="underline">Mon compte</a> et l&apos;onglet
        Rencontres (bouton supprimer mon profil).
      </p>
    </section>
  );
}
