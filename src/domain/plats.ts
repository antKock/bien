// Portions, lots et liste de courses. L'utilisateur ne saisit qu'un nombre de
// repas ; tout le calcul est ici et ne s'affiche que dans la liste.

export const REPAS_MIN = 1;
export const REPAS_MAX = 4;

export const RAYONS = ["primeur", "boucher", "poissonnier", "cremerie", "epicerie", "surgeles", "epices_base"] as const;
export type Rayon = (typeof RAYONS)[number];
export type Scalabilite = "continu" | "par_lot";

export type IngredientInfo = {
  nom: string;
  /** Pour un lot. Vide pour « épices & base ». */
  quantite: number | null;
  unite: string | null;
  rayon: Rayon;
};

export type RecetteInfo = {
  nom: string;
  portionsParLot: number;
  scalabilite: Scalabilite;
  ingredients: IngredientInfo[];
};

export type PlatInfo = {
  recette: RecetteInfo;
  repas: number;
};

export function repasValide(n: number): boolean {
  return Number.isInteger(n) && n >= REPAS_MIN && n <= REPAS_MAX;
}

export function portionsRequises(personnes: number, repas: number): number {
  return personnes * repas;
}

/** `par_lot` arrondit au lot entier supérieur ; `continu` multiplie à la fraction près. */
export function lots(portionsRequises: number, portionsParLot: number, scalabilite: Scalabilite): number {
  const brut = portionsRequises / portionsParLot;
  return scalabilite === "par_lot" ? Math.ceil(brut) : brut;
}

export function lotsDuPlat(plat: PlatInfo, personnes: number): number {
  return lots(portionsRequises(personnes, plat.repas), plat.recette.portionsParLot, plat.recette.scalabilite);
}

/** Quantité d'un ingrédient pour un plat : ×lots, sauf « épices & base ». */
export function quantiteIngredient(ingredient: IngredientInfo, nbLots: number): number | null {
  if (ingredient.rayon === "epices_base" || ingredient.quantite === null) return null;
  return ingredient.quantite * nbLots;
}

// Liste de courses : agrégée par (nom normalisé, unité), groupée par rayon,
// chaque article gardant sa provenance (« Quiche ×3 »).

export type Provenance = { plat: string; repas: number };

export type Article = {
  nom: string;
  unite: string | null;
  /** Vide = « à vérifier ». */
  quantite: number | null;
  rayon: Rayon;
  provenances: Provenance[];
};

export type ListeCourses = {
  parRayon: { rayon: Rayon; articles: Article[] }[];
  parPlat: { plat: string; repas: number; articles: Article[] }[];
  nbArticles: number;
};

export function normaliserNom(nom: string): string {
  return nom.trim().toLowerCase().replace(/\s+/g, " ");
}

function cle(i: IngredientInfo): string {
  return `${normaliserNom(i.nom)}|${i.rayon === "epices_base" ? "" : (i.unite ?? "").trim().toLowerCase()}`;
}

function articlesDuPlat(plat: PlatInfo, personnes: number): Article[] {
  const nbLots = lotsDuPlat(plat, personnes);
  return plat.recette.ingredients.map((i) => ({
    nom: i.nom,
    unite: i.rayon === "epices_base" ? null : i.unite,
    quantite: quantiteIngredient(i, nbLots),
    rayon: i.rayon,
    provenances: [{ plat: plat.recette.nom, repas: plat.repas }],
  }));
}

export function listeCourses(plats: PlatInfo[], personnes: number): ListeCourses {
  const agreges = new Map<string, Article>();
  const parPlat: ListeCourses["parPlat"] = [];
  for (const plat of plats) {
    const articles = articlesDuPlat(plat, personnes);
    parPlat.push({ plat: plat.recette.nom, repas: plat.repas, articles });
    for (const [idx, a] of articles.entries()) {
      const k = cle(plat.recette.ingredients[idx]);
      const existant = agreges.get(k);
      if (!existant) {
        agreges.set(k, { ...a, provenances: [...a.provenances] });
      } else {
        existant.quantite =
          existant.quantite === null || a.quantite === null ? null : existant.quantite + a.quantite;
        existant.provenances.push(...a.provenances);
      }
    }
  }
  const parRayon = RAYONS.map((rayon) => ({
    rayon,
    articles: [...agreges.values()].filter((a) => a.rayon === rayon),
  })).filter((r) => r.articles.length > 0);
  return { parRayon, parPlat, nbArticles: agreges.size };
}

// Résumés de la carte de semaine et confirmation.

export type PlatConfirmation = { repas: number; repasCuisines: number };

export function resumePlats(plats: PlatConfirmation[]): { plats: number; repas: number; cuisines: number } {
  return {
    plats: plats.length,
    repas: plats.reduce((n, p) => n + p.repas, 0),
    cuisines: plats.reduce((n, p) => n + p.repasCuisines, 0),
  };
}

/** Cocher la case `n` (1-based) d'un plat : le modèle compte, il ne liste pas. */
export function repasCuisinesApresCoche(plat: PlatConfirmation, n: number, coche: boolean): number {
  if (n < 1 || n > plat.repas) throw new RangeError(`Repas ${n} hors de 1-${plat.repas}`);
  return coche ? Math.max(plat.repasCuisines, n) : Math.min(plat.repasCuisines, n - 1);
}

/** Changer le nombre de repas ne peut pas laisser plus de cuisinés que de repas. */
export function repasCuisinesApresStepper(plat: PlatConfirmation, repas: number): number {
  return Math.min(plat.repasCuisines, repas);
}

// Clé et affichage d'un article.

/** La clé d'un article agrégé : nom normalisé et unité ; sert aux coches de la liste. */
export function cleArticle(a: Pick<Article, "nom" | "unite">): string {
  return `${normaliserNom(a.nom)}|${(a.unite ?? "").trim().toLowerCase()}`;
}

const SANS_PLURIEL = new Set(["g", "kg", "ml", "cl", "l", "cs", "cc", "càs", "càc"]);

function formatNombre(n: number): string {
  const arrondi = Math.round(n * 10) / 10;
  return String(arrondi).replace(".", ",");
}

const MESURABLES = new Set(["g", "kg", "ml", "cl", "l"]);

/**
 * « 8 », « 600 g », « 1,1 kg », « 3 boîtes », « à vérifier ». Ce qui se compte
 * (pièces, boîtes, sachets) s'arrondit à l'entier supérieur : on n'achète pas
 * 3,5 oignons.
 */
export function formatQuantite(quantite: number | null, unite: string | null): string {
  if (quantite === null) return "à vérifier";
  const u = (unite ?? "").trim();
  if (!MESURABLES.has(u.toLowerCase())) {
    const n = Math.ceil(quantite - 1e-9);
    if (u === "" || u === "pièce") return String(n);
    const pluriel = n >= 2 && !SANS_PLURIEL.has(u.toLowerCase()) && !u.endsWith("s");
    return `${n} ${u}${pluriel ? "s" : ""}`;
  }
  if (u === "g" && quantite >= 1000) return `${formatNombre(quantite / 1000)} kg`;
  if (u === "ml" && quantite >= 1000) return `${formatNombre(quantite / 1000)} l`;
  return `${formatNombre(quantite)} ${u}`;
}

/** « Quiche ×3 · Tajine ×1 », ou « 3 plats » au-delà de deux provenances. */
export function formatProvenance(provenances: Provenance[]): string {
  if (provenances.length > 2) return `${provenances.length} plats`;
  return provenances.map((p) => `${p.plat} ×${p.repas}`).join(" · ");
}
