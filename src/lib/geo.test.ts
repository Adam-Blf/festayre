/**
 * Tests du module geo, le calcul de distance est LE coeur metier :
 * s'il est faux, on envoie un festayre aux mauvaises toilettes.
 */
import { describe, expect, it } from "vitest";
import { formatDistance, haversineMeters, sortByDistance } from "./geo";

// Reperes reels de Bayonne pour un test verifiable sur une carte.
const MAIRIE_BAYONNE = { lat: 43.4904, lng: -1.4754 };
const GARE_BAYONNE = { lat: 43.4967, lng: -1.4713 };

describe("haversineMeters", () => {
  it("distance nulle entre un point et lui-meme", () => {
    expect(haversineMeters(MAIRIE_BAYONNE, MAIRIE_BAYONNE)).toBe(0);
  });

  it("mairie -> gare de Bayonne : environ 770 m a vol d'oiseau", () => {
    const d = haversineMeters(MAIRIE_BAYONNE, GARE_BAYONNE);
    expect(d).toBeGreaterThan(600);
    expect(d).toBeLessThan(900);
  });

  it("symetrique : d(a,b) = d(b,a)", () => {
    expect(haversineMeters(MAIRIE_BAYONNE, GARE_BAYONNE)).toBeCloseTo(
      haversineMeters(GARE_BAYONNE, MAIRIE_BAYONNE)
    );
  });
});

describe("formatDistance", () => {
  it("metres arrondis a 10 m sous le kilometre", () => {
    expect(formatDistance(123)).toBe("120 m");
    expect(formatDistance(996)).toBe("1000 m");
  });

  it("kilometres avec virgule francaise au dela", () => {
    expect(formatDistance(1234)).toBe("1,2 km");
  });

  it("valeurs invalides affichees en ?", () => {
    expect(formatDistance(-5)).toBe("?");
    expect(formatDistance(NaN)).toBe("?");
  });
});

describe("sortByDistance", () => {
  it("trie du plus proche au plus lointain sans muter l'original", () => {
    const far = { lat: 43.51, lng: -1.47, name: "loin" };
    const near = { lat: 43.4905, lng: -1.4755, name: "proche" };
    const input = [far, near];

    const sorted = sortByDistance(input, MAIRIE_BAYONNE);

    expect(sorted[0].name).toBe("proche");
    expect(sorted[1].name).toBe("loin");
    expect(sorted[0].distanceM).toBeLessThan(sorted[1].distanceM);
    // L'original garde son ordre : fonction pure.
    expect(input[0].name).toBe("loin");
  });
});
