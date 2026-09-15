// Ce que Bien déduit d'une recette Mijote : durée, portions, scalabilité et
// ingrédients avec rayon, lus depuis le texte libre du carnet. C'est la
// nomenclature minimale assumée par le document de règles : un dictionnaire
// de mots, enrichi au fil des semaines.
import type { IngredientInfo, Rayon, Scalabilite } from "./plats";

export type RecetteMijote = {
  id: string;
  titre: string;
  ingredients: string | null;
  parts: number | null;
  preparation: string | null;
  cuisson: string | null;
  image: string | null;
  lien: string | null;
};

export type Duree = "express" | "rapide" | "long";

const PREPARATIONS = ["< 10 min", "10-20 min", "20-30 min", "30-45 min", "> 45 min"];
const CUISSONS = ["Aucune", "< 15 min", "15-30 min", "30 min - 1h", "1h - 2h", "> 2h"];

/** Express : préparation courte et cuisson sous 15 min ; long : une heure de cuisson ou plus ; rapide sinon. */
export function dureeDe(preparation: string | null, cuisson: string | null): Duree {
  const p = PREPARATIONS.indexOf(preparation ?? "");
  const c = CUISSONS.indexOf(cuisson ?? "");
  if (c >= 4 || p >= 4) return "long";
  if (p >= 0 && p <= 1 && c >= 0 && c <= 1) return "express";
  return "rapide";
}

const PAR_LOT = /quiche|gratin|tarte|cake|lasagne|clafoutis|pizza|flan|terrine|moussaka|parmentier|tourte/i;

export function scalabiliteDe(titre: string): Scalabilite {
  return PAR_LOT.test(titre) ? "par_lot" : "continu";
}

export const PORTIONS_PAR_DEFAUT = 4;

export function portionsDe(parts: number | null): number {
  return parts && parts >= 1 && parts <= 20 ? Math.round(parts) : PORTIONS_PAR_DEFAUT;
}

// --- Ingrédients -----------------------------------------------------------

const UNITES: [RegExp, string][] = [
  [/^(kg|kilo|kilos)$/i, "kg"],
  [/^(g|gr|gramme|grammes)$/i, "g"],
  [/^(ml)$/i, "ml"],
  [/^(cl)$/i, "cl"],
  [/^(l|litre|litres)$/i, "l"],
  [/^(cs|càs|c\.?\s?à\s?s\.?|cuill?[èe]res?\s+à\s+soupe|c\.?\s?à\s?soupe)$/i, "cs"],
  [/^(cc|càc|c\.?\s?à\s?c\.?|cuill?[èe]res?\s+à\s+café|c\.?\s?à\s?café)$/i, "cc"],
  [/^(bo[îi]tes?)$/i, "boîte"],
  [/^(sachets?)$/i, "sachet"],
  [/^(tranches?)$/i, "tranche"],
  [/^(gousses?)$/i, "gousse"],
  [/^(pinc[ée]es?)$/i, "pincée"],
  [/^(branches?)$/i, "branche"],
  [/^(bouquets?)$/i, "bouquet"],
  [/^(pots?)$/i, "pot"],
  [/^(briques?)$/i, "brique"],
  [/^(bocaux|bocal)$/i, "bocal"],
  [/^(filets?)$/i, "filet"],
  [/^(pav[ée]s?)$/i, "pavé"],
  [/^(paquets?)$/i, "paquet"],
  [/^(poign[ée]es?)$/i, "poignée"],
];

const NOMBRE = /^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|½|¼|¾)\s*/;

function lireNombre(brut: string): number {
  if (brut === "½") return 0.5;
  if (brut === "¼") return 0.25;
  if (brut === "¾") return 0.75;
  const frac = brut.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  return Number(brut.replace(",", "."));
}

export type LigneIngredient = { nom: string; quantite: number | null; unite: string | null };

/** « 750 g de bœuf haché » → { nom: « Bœuf haché », 750, g } ; « 2 poivrons » → pièce ; « Sel » → sans quantité. */
export function lireLigne(ligne: string): LigneIngredient | null {
  let t = ligne
    .replace(/^[\s\-•*·]+/, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  // Une ligne de section (« // Pour la sauce », « Pour la pâte : ») n'est pas un ingrédient.
  if (!t || /^(\/\/|#)/.test(t) || /:$/.test(t) || /^pour (la|le|les|l')\b/i.test(t)) return null;
  let quantite: number | null = null;
  let unite: string | null = null;
  const n = t.match(NOMBRE);
  if (n) {
    quantite = lireNombre(n[1].trim());
    t = t.slice(n[0].length);
    // L'unité est le premier mot (ou « c. à soupe »), suivi de « de » / « d' ».
    const m = t.match(/^((?:c\.?\s?à\s?(?:soupe|café|s\.?|c\.?))|cuill?[èe]res?\s+à\s+(?:soupe|café)|[^\s]+)\s*(?:de\s+|d')?/i);
    if (m) {
      const u = UNITES.find(([re]) => re.test(m[1]));
      if (u) {
        unite = u[1];
        t = t.slice(m[0].length);
      } else {
        unite = "pièce";
        t = t.replace(/^(?:de\s+|d')/i, "");
      }
    }
  }
  t = t.replace(/^(?:de\s+|d')/i, "").trim();
  if (!t) return null;
  const nom = t.charAt(0).toLocaleUpperCase("fr-FR") + t.slice(1);
  return { nom, quantite, unite };
}

const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Ordre des règles : la première qui matche l'emporte.
const RAYONS: [Rayon, RegExp][] = [
  ["surgeles", /surgel|picard|glace/],
  ["epicerie", /concass|pelee|coulis|concentre|conserve|boite|bocal|coco|haricots? (rouge|blanc|noir)|pois chiche|lentille|pate|riz|semoule|boulgour|quinoa|nouille|tortilla|galette|pain|farine|sucre|biscotte|polenta|gnocchi|vermicelle|couscous|chapelure|thon|sardine|maquereau/],
  ["epices_base", /\bsel\b|poivre|huile|vinaigre|moutarde|epice|paprika|cumin|curry|curcuma|herbe|thym|laurier|origan|persil|coriandre|basilic|ciboulette|\bail\b|bouillon|cube|sauce|soja|gingembre|piment|muscade|cannelle|ras el|garam|miel|zeste|levure|bicarbonate|fond de|tabasco|harissa|graines?|sesame/],
  ["poissonnier", /saumon|cabillaud|colin|lieu|crevette|poisson|truite|dorade|daurade|\bbar\b|merlu|moule|calamar|encornet|lotte|sole|julienne|eglefin|haddock/],
  ["boucher", /boeuf|bœuf|poulet|dinde|veau|agneau|porc|jambon|lardon|viande|steak|escalope|cuisse|merguez|saucisse|canard|bresaola|grison|chipolata|rôti|roti|filet mignon|viande hach/],
  ["cremerie", /oeuf|œuf|creme|lait|beurre|fromage|chevre|feta|parmesan|mozzarella|yaourt|emmental|comte|gruyere|ricotta|mascarpone|tofu|pate brisee|pate feuilletee|raclette|cheddar/],
  ["primeur", /.*/],
];

const UNITES_EPICES = new Set(["cs", "cc", "pincée", "branche", "bouquet", "gousse", "poignée"]);

export function rayonDe(nom: string, unite: string | null): Rayon {
  if (unite && UNITES_EPICES.has(unite)) return "epices_base";
  const n = sansAccents(nom);
  if (unite === "boîte" || unite === "bocal" || unite === "brique") {
    if (/lait de coco|creme/.test(n)) return "epicerie";
    if (!/oeuf|œuf|fromage|yaourt/.test(n)) return "epicerie";
  }
  return RAYONS.find(([, re]) => re.test(n))![0];
}

/** Le texte Mijote, une ligne par ingrédient, devient la liste d'ingrédients de Bien. */
export function lireIngredients(texte: string | null): IngredientInfo[] {
  if (!texte) return [];
  const lignes: IngredientInfo[] = [];
  for (const brut of texte.split(/\r?\n/)) {
    const l = lireLigne(brut);
    if (!l) continue;
    const rayon = rayonDe(l.nom, l.unite);
    lignes.push(
      rayon === "epices_base"
        ? { nom: l.nom, quantite: null, unite: null, rayon }
        : { nom: l.nom, quantite: l.quantite, unite: l.quantite === null ? null : l.unite, rayon },
    );
  }
  return lignes;
}
