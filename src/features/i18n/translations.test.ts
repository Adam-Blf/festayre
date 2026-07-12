/**
 * Test d'exhaustivite i18n : chaque cle doit exister et etre non vide
 * dans CHAQUE langue. Un trou de traduction est un bug, pas un detail.
 */
import { describe, expect, it } from "vitest";
import { ALL_STRINGS, LANGS, t } from "./translations";

describe("dictionnaire i18n", () => {
  it("aucune cle sans traduction dans une des langues", () => {
    for (const [key, byLang] of Object.entries(ALL_STRINGS)) {
      for (const lang of LANGS) {
        expect(byLang[lang], `${key} manquant en ${lang}`).toBeTruthy();
        expect(byLang[lang].trim().length, `${key} vide en ${lang}`).toBeGreaterThan(0);
      }
    }
  });

  it("t() traduit et distingue les langues", () => {
    expect(t("cat.toilets", "fr")).toBe("Toilettes");
    expect(t("cat.toilets", "es")).toBe("Baños");
    expect(t("cat.toilets", "en")).toBe("Toilets");
  });
});
