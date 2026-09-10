// Le code d'un foyer : six caractères parmi A-Z et 0-9, saisis sans tenir compte
// de la casse ni des espaces.

export const LONGUEUR_CODE = 6;
const AUTORISES = /[^A-Z0-9]/g;

/** Nettoie une saisie : majuscules, sans espace ni caractère hors alphabet, tronquée à six. */
export function normaliserCode(saisie: string): string {
  return saisie.toUpperCase().replace(AUTORISES, "").slice(0, LONGUEUR_CODE);
}

export function codeComplet(code: string): boolean {
  return code.length === LONGUEUR_CODE && normaliserCode(code) === code;
}
