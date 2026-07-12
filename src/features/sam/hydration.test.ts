/**
 * Tests du rappel d'hydratation : le seuil des 2 h est un invariant
 * metier (sante), il doit etre exact.
 */
import { describe, expect, it } from "vitest";
import {
  HYDRATION_INTERVAL_MS,
  INITIAL_HYDRATION,
  isOverdue,
  recordRound,
  sinceLabel,
} from "./hydration";

const T0 = new Date("2026-07-15T22:00:00Z");

describe("recordRound", () => {
  it("incremente le compteur et fixe l'horodatage", () => {
    const s1 = recordRound(INITIAL_HYDRATION, T0);
    expect(s1.rounds).toBe(1);
    expect(s1.lastRoundAt).toBe(T0.toISOString());
    const s2 = recordRound(s1, new Date(T0.getTime() + 1000));
    expect(s2.rounds).toBe(2);
  });
});

describe("isOverdue", () => {
  it("jamais d'alerte sans premiere tournee", () => {
    expect(isOverdue(INITIAL_HYDRATION, T0)).toBe(false);
  });

  it("pas d'alerte a 1h59, alerte a 2h01", () => {
    const s = recordRound(INITIAL_HYDRATION, T0);
    const justBefore = new Date(T0.getTime() + HYDRATION_INTERVAL_MS - 60_000);
    const justAfter = new Date(T0.getTime() + HYDRATION_INTERVAL_MS + 60_000);
    expect(isOverdue(s, justBefore)).toBe(false);
    expect(isOverdue(s, justAfter)).toBe(true);
  });
});

describe("sinceLabel", () => {
  it("formats minutes, heures et jamais", () => {
    expect(sinceLabel(INITIAL_HYDRATION, T0)).toBe("jamais");
    const s = recordRound(INITIAL_HYDRATION, T0);
    expect(sinceLabel(s, new Date(T0.getTime() + 5 * 60_000))).toBe("il y a 5 min");
    expect(sinceLabel(s, new Date(T0.getTime() + 80 * 60_000))).toBe("il y a 1h20");
    expect(sinceLabel(s, new Date(T0.getTime() + 120 * 60_000))).toBe("il y a 2h");
  });
});
