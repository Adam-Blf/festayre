/**
 * hydration.ts, logique pure du rappel d'hydratation du mode SAM.
 *
 * Regle terrain : une tournee d'eau pour le groupe TOUTES LES DEUX
 * HEURES maximum. Passe ce delai, l'ecran SAM passe en alerte.
 * Logique separee de l'UI pour etre testable a la seconde pres.
 */

/** Delai maximum entre deux tournees d'eau (2 h en millisecondes). */
export const HYDRATION_INTERVAL_MS = 2 * 60 * 60 * 1000;

/** Etat persiste du suivi d'hydratation. */
export type HydrationState = {
  /** Derniere tournee d'eau (ISO), null si aucune cette session. */
  lastRoundAt: string | null;
  /** Nombre de tournees faites (fierte du SAM). */
  rounds: number;
};

export const INITIAL_HYDRATION: HydrationState = { lastRoundAt: null, rounds: 0 };

/** Enregistre une tournee d'eau maintenant. */
export function recordRound(state: HydrationState, now: Date = new Date()): HydrationState {
  return { lastRoundAt: now.toISOString(), rounds: state.rounds + 1 };
}

/**
 * true si la prochaine tournee est en retard.
 * Aucune tournee enregistree = pas d'alerte (le suivi demarre a la
 * premiere tournee, pas a l'ouverture de la page).
 */
export function isOverdue(state: HydrationState, now: Date = new Date()): boolean {
  if (!state.lastRoundAt) return false;
  return now.getTime() - new Date(state.lastRoundAt).getTime() > HYDRATION_INTERVAL_MS;
}

/**
 * Libelle du temps ecoule depuis la derniere tournee :
 * "il y a 5 min", "il y a 1h20", "jamais".
 */
export function sinceLabel(state: HydrationState, now: Date = new Date()): string {
  if (!state.lastRoundAt) return "jamais";
  const mins = Math.max(0, Math.floor((now.getTime() - new Date(state.lastRoundAt).getTime()) / 60000));
  if (mins < 60) return `il y a ${mins} min`;
  const h = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest === 0 ? `il y a ${h}h` : `il y a ${h}h${String(rest).padStart(2, "0")}`;
}
