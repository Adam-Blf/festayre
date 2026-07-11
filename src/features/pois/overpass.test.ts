/**
 * Tests du parsing Overpass et de la regle de prix alcool.
 * Fixture representative d'une vraie reponse Overpass (node + way).
 */
import { describe, expect, it } from "vitest";
import {
  boozeTier,
  buildOverpassQuery,
  parseOverpassResponse,
  type OverpassElement,
} from "./overpass";

const FIXTURE: { elements: OverpassElement[] } = {
  elements: [
    // Toilettes publiques gratuites (node classique).
    {
      type: "node",
      id: 1,
      lat: 43.49,
      lon: -1.47,
      tags: { amenity: "toilets", fee: "no" },
    },
    // Supermarche cartographie en way : coordonnees dans "center".
    {
      type: "way",
      id: 2,
      center: { lat: 43.492, lon: -1.472 },
      tags: { shop: "supermarket", name: "Carrefour City" },
    },
    // Epicerie de depannage.
    { type: "node", id: 3, lat: 43.4901, lon: -1.4701, tags: { shop: "convenience" } },
    // Arret de bus pour les navettes.
    { type: "node", id: 4, lat: 43.4935, lon: -1.4762, tags: { highway: "bus_stop", name: "Mairie" } },
    // Element non pertinent : doit etre ignore.
    { type: "node", id: 5, lat: 43.49, lon: -1.47, tags: { amenity: "bench" } },
    // Way sans centre calcule : doit etre ignore sans crasher.
    { type: "way", id: 6, tags: { amenity: "toilets" } },
  ],
};

describe("parseOverpassResponse", () => {
  const pois = parseOverpassResponse(FIXTURE);

  it("garde les POI utiles et jette le bruit", () => {
    expect(pois).toHaveLength(4);
    expect(pois.map((p) => p.category).sort()).toEqual([
      "booze",
      "booze",
      "toilets",
      "transport",
    ]);
  });

  it("resout les coordonnees des ways via center", () => {
    const market = pois.find((p) => p.name === "Carrefour City")!;
    expect(market.lat).toBeCloseTo(43.492);
    expect(market.lng).toBeCloseTo(-1.472);
  });

  it("classe le supermarche moins cher que l'epicerie", () => {
    const market = pois.find((p) => p.name === "Carrefour City")!;
    const corner = pois.find((p) => p.id === "node/3")!;
    expect(market.priceTier).toBe(1);
    expect(corner.priceTier).toBe(3);
  });

  it("expose le fee des toilettes pour l'affichage", () => {
    const wc = pois.find((p) => p.category === "toilets")!;
    expect(wc.fee).toBe("no");
    expect(wc.name).toBe("Toilettes publiques");
  });

  it("reponse vide -> liste vide, pas d'exception", () => {
    expect(parseOverpassResponse({})).toEqual([]);
  });
});

describe("boozeTier", () => {
  it("hierarchie des prix conforme au terrain", () => {
    expect(boozeTier("supermarket")).toBe(1);
    expect(boozeTier("alcohol")).toBe(2);
    expect(boozeTier("wine")).toBe(2);
    expect(boozeTier("convenience")).toBe(3);
  });
});

describe("buildOverpassQuery", () => {
  it("contient le rayon, le centre et toutes les familles de POI", () => {
    const q = buildOverpassQuery({ lat: 43.49, lng: -1.47 }, 4000);
    expect(q).toContain("around:4000,43.49,-1.47");
    for (const needle of ["toilets", "drinking_water", "supermarket", "pharmacy", "bus_stop"]) {
      expect(q).toContain(needle);
    }
  });
});
