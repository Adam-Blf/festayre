/**
 * code.ts, generation du code d'invitation de groupe.
 * Alphabet sans ambiguite (pas de O/0, I/1, L) : le code se dicte a
 * voix haute dans le bruit d'une bodega.
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const GROUP_CODE_LENGTH = 6;

/** Genere un code de groupe aleatoire (crypto si dispo). */
export function generateGroupCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < GROUP_CODE_LENGTH; i += 1) {
    code += ALPHABET[Math.floor(random() * ALPHABET.length)];
  }
  return code;
}

/** Normalise une saisie utilisateur ("ab c12" -> "ABC12"). */
export function normalizeGroupCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, GROUP_CODE_LENGTH);
}

/** true si le code a le bon format (longueur + alphabet). */
export function isValidGroupCode(code: string): boolean {
  return code.length === GROUP_CODE_LENGTH && [...code].every((ch) => ALPHABET.includes(ch));
}
