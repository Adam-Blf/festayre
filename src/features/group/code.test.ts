/**
 * Tests du code d'invitation : format stable, normalisation robuste
 * aux saisies de festayres fatigues.
 */
import { describe, expect, it } from "vitest";
import { generateGroupCode, isValidGroupCode, normalizeGroupCode } from "./code";

describe("generateGroupCode", () => {
  it("6 caracteres, alphabet sans ambiguite", () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generateGroupCode();
      expect(isValidGroupCode(code)).toBe(true);
      expect(code).not.toMatch(/[O0IL1]/);
    }
  });

  it("deterministe avec un generateur fixe", () => {
    expect(generateGroupCode(() => 0)).toBe("AAAAAA");
  });
});

describe("normalizeGroupCode", () => {
  it("majuscules, espaces et tirets nettoyes, tronque a 6", () => {
    expect(normalizeGroupCode(" ab-c 234x ")).toBe("ABC234");
  });
});

describe("isValidGroupCode", () => {
  it("refuse les longueurs et caracteres invalides", () => {
    expect(isValidGroupCode("ABC23")).toBe(false);
    expect(isValidGroupCode("ABC10O")).toBe(false);
    expect(isValidGroupCode("ABC234")).toBe(true);
  });
});
