// Les noms conservés : « autre » des jokers, plat libre, activité « autre ».
// Une même feuille de nommage pour les trois, une même table.

export const USAGES_NOM = ["autre", "plat_libre", "activite", "article"] as const;
export type UsageNom = (typeof USAGES_NOM)[number];

export const LONGUEUR_NOM_MAX = 40;

/** Nettoie une saisie : espaces réduits, première lettre en majuscule. Vide si rien. */
export function normaliserLibelle(saisie: string): string {
  const t = saisie.trim().replace(/\s+/g, " ").slice(0, LONGUEUR_NOM_MAX);
  return t.charAt(0).toLocaleUpperCase("fr-FR") + t.slice(1);
}

export function memeLibelle(a: string, b: string): boolean {
  return normaliserLibelle(a).toLocaleLowerCase("fr-FR") === normaliserLibelle(b).toLocaleLowerCase("fr-FR");
}
