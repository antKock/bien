// Les deux personnes du foyer : rien de plus que leurs prénoms et leur ordre.

/** Initiales d'avatar : la première lettre ; deux lettres pour un prénom qui commence comme un précédent (« A », « Al »). */
export function initiales(prenoms: string[]): string[] {
  const prises = new Set<string>();
  return prenoms.map((p) => {
    const une = p.charAt(0).toLocaleUpperCase("fr-FR");
    const ini = prises.has(une) ? une + p.slice(1, 2).toLocaleLowerCase("fr-FR") : une;
    prises.add(une);
    return ini;
  });
}
