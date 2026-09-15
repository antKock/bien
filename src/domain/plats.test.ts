import { describe, expect, it } from "vitest";
import {
  cleArticle,
  formatProvenance,
  formatQuantite,
  listeCourses,
  lots,
  lotsDuPlat,
  normaliserNom,
  repasCuisinesApresCoche,
  repasCuisinesApresStepper,
  repasValide,
  resumePlats,
  type RecetteInfo,
} from "./plats";

const PERSONNES = 2;

// Recettes de démonstration, calées sur la liste de courses des maquettes.
const QUICHE: RecetteInfo = {
  nom: "Quiche",
  portionsParLot: 4,
  scalabilite: "par_lot",
  ingredients: [
    { nom: "Poireaux", quantite: 4, unite: "pièce", rayon: "primeur" },
    { nom: "Bûche de chèvre", quantite: 2, unite: "pièce", rayon: "cremerie" },
    { nom: "Œufs", quantite: 6, unite: "pièce", rayon: "cremerie" },
    { nom: "Huile d'olive", quantite: null, unite: null, rayon: "epices_base" },
  ],
};
const CHILI: RecetteInfo = {
  nom: "Chili",
  portionsParLot: 4,
  scalabilite: "continu",
  ingredients: [
    { nom: "Bœuf haché 5 %", quantite: 750, unite: "g", rayon: "boucher" },
    { nom: "Poivrons rouges", quantite: 2, unite: "pièce", rayon: "primeur" },
    { nom: "Haricots rouges", quantite: 2, unite: "boîte", rayon: "epicerie" },
    { nom: "Paprika fumé", quantite: null, unite: null, rayon: "epices_base" },
    { nom: "Huile d'olive", quantite: null, unite: null, rayon: "epices_base" },
  ],
};
const TAJINE: RecetteInfo = {
  nom: "Tajine",
  portionsParLot: 2,
  scalabilite: "continu",
  ingredients: [
    { nom: "Cuisses de poulet", quantite: 6, unite: "pièce", rayon: "boucher" },
    { nom: "poivrons  rouges", quantite: 2, unite: "pièce", rayon: "primeur" },
  ],
};
const SOUPE: RecetteInfo = {
  nom: "Soupe",
  portionsParLot: 6,
  scalabilite: "continu",
  ingredients: [{ nom: "Carottes", quantite: 600, unite: "g", rayon: "primeur" }],
};

describe("lots : le rendement natif", () => {
  it.each([
    ["quiche, 2 dîners → 4 requises, 4 natives", 4, 4, "par_lot", 1],
    ["soupe, 3 dîners → 6 requises, 6 natives", 6, 6, "continu", 1],
    ["quiche, 3 dîners → 6 requises, par lot → 2", 6, 4, "par_lot", 2],
    ["chili, 3 dîners depuis 4 portions → continu → 1,5", 6, 4, "continu", 1.5],
  ] as const)("%s", (_, requises, parLot, scal, attendu) => {
    expect(lots(requises, parLot, scal)).toBe(attendu);
  });

  it("à besoin identique, la quiche double et le chili ne fait qu'une fois et demie", () => {
    expect(lotsDuPlat({ recette: QUICHE, repas: 3 }, PERSONNES)).toBe(2);
    expect(lotsDuPlat({ recette: CHILI, repas: 3 }, PERSONNES)).toBe(1.5);
  });

  it("stocker des portions reste vrai avec un invité : la même quiche ne couvre qu'un repas à 4", () => {
    expect(lotsDuPlat({ recette: QUICHE, repas: 1 }, 4)).toBe(1);
    expect(lotsDuPlat({ recette: QUICHE, repas: 2 }, 4)).toBe(2);
  });

  it("le nombre de repas va de 1 à 4", () => {
    expect(repasValide(1)).toBe(true);
    expect(repasValide(4)).toBe(true);
    expect(repasValide(0)).toBe(false);
    expect(repasValide(5)).toBe(false);
    expect(repasValide(1.5)).toBe(false);
  });
});

describe("liste de courses (écran 08)", () => {
  const liste = listeCourses(
    [
      { recette: CHILI, repas: 3 },
      { recette: QUICHE, repas: 3 },
      { recette: TAJINE, repas: 1 },
      { recette: SOUPE, repas: 3 },
    ],
    PERSONNES,
  );
  const article = (nom: string) =>
    liste.parRayon.flatMap((r) => r.articles).find((a) => normaliserNom(a.nom) === normaliserNom(nom))!;

  it("quiche ×3 = 2 lots : 8 poireaux, 4 bûches, 12 œufs", () => {
    expect(article("Poireaux").quantite).toBe(8);
    expect(article("Bûche de chèvre").quantite).toBe(4);
    expect(article("Œufs").quantite).toBe(12);
  });

  it("chili ×3 = ×1,5 : 1 125 g de bœuf, 3 boîtes", () => {
    expect(article("Bœuf haché 5 %").quantite).toBe(1125);
    expect(article("Haricots rouges").quantite).toBe(3);
  });

  it("agrège les ingrédients communs par nom normalisé et unité, provenance conservée", () => {
    const poivrons = article("Poivrons rouges");
    expect(poivrons.quantite).toBe(5);
    expect(poivrons.provenances).toEqual([
      { plat: "Chili", repas: 3 },
      { plat: "Tajine", repas: 1 },
    ]);
  });

  it("soupe ×3 sur 6 portions natives : un lot, 600 g inchangés", () => {
    expect(article("Carottes").quantite).toBe(600);
  });

  it("un plat continu sous son rendement natif descend sous le lot", () => {
    const seule = listeCourses([{ recette: SOUPE, repas: 1 }], PERSONNES);
    expect(seule.parRayon[0].articles[0].quantite).toBe(200);
  });

  it("« épices & base » ne suit pas les lots : sans quantité, groupé en fin de liste", () => {
    const huile = article("Huile d'olive");
    expect(huile.quantite).toBeNull();
    expect(huile.provenances.map((p) => p.plat)).toEqual(["Chili", "Quiche"]);
    expect(liste.parRayon.at(-1)?.rayon).toBe("epices_base");
  });

  it("groupe par rayon dans l'ordre du magasin, sans rayon vide", () => {
    expect(liste.parRayon.map((r) => r.rayon)).toEqual(["primeur", "boucher", "cremerie", "epicerie", "epices_base"]);
    expect(liste.nbArticles).toBe(10);
  });

  it("« par plat » liste chaque plat avec ses propres quantités", () => {
    const quiche = liste.parPlat.find((p) => p.plat === "Quiche")!;
    expect(quiche.repas).toBe(3);
    expect(quiche.articles.find((a) => a.nom === "Œufs")?.quantite).toBe(12);
  });

  it("une liste sans plat est une liste vide, pas une erreur", () => {
    expect(listeCourses([], PERSONNES)).toEqual({ parRayon: [], parPlat: [], nbArticles: 0 });
  });
});

describe("confirmation des plats (écran 18)", () => {
  it("résume plats, repas et cuisinés", () => {
    expect(
      resumePlats([
        { repas: 1, repasCuisines: 1 },
        { repas: 1, repasCuisines: 0 },
        { repas: 2, repasCuisines: 1 },
        { repas: 1, repasCuisines: 1 },
      ]),
    ).toEqual({ plats: 4, repas: 5, cuisines: 3 });
  });

  it("cocher la case n compte n cuisinés ; la décocher en laisse n − 1", () => {
    const plat = { repas: 3, repasCuisines: 1 };
    expect(repasCuisinesApresCoche(plat, 2, true)).toBe(2);
    expect(repasCuisinesApresCoche(plat, 3, true)).toBe(3);
    expect(repasCuisinesApresCoche({ repas: 3, repasCuisines: 3 }, 1, false)).toBe(0);
    expect(repasCuisinesApresCoche({ repas: 3, repasCuisines: 3 }, 2, false)).toBe(1);
    expect(() => repasCuisinesApresCoche(plat, 4, true)).toThrow(RangeError);
  });

  it("baisser le nombre de repas ne laisse jamais plus de cuisinés que de repas", () => {
    expect(repasCuisinesApresStepper({ repas: 3, repasCuisines: 3 }, 2)).toBe(2);
    expect(repasCuisinesApresStepper({ repas: 3, repasCuisines: 1 }, 4)).toBe(1);
  });
});

describe("affichage d'un article", () => {
  it("écrit la quantité selon l'unité", () => {
    expect(formatQuantite(8, "pièce")).toBe("8");
    expect(formatQuantite(600, "g")).toBe("600 g");
    expect(formatQuantite(1125, "g")).toBe("1,1 kg");
    expect(formatQuantite(3, "boîte")).toBe("3 boîtes");
    expect(formatQuantite(1, "boîte")).toBe("1 boîte");
    expect(formatQuantite(1.5, "kg")).toBe("1,5 kg");
    expect(formatQuantite(3.5, "pièce")).toBe("4");
    expect(formatQuantite(1.5, "boîte")).toBe("2 boîtes");
    expect(formatQuantite(2.5, "sachet")).toBe("3 sachets");
    expect(formatQuantite(null, null)).toBe("à vérifier");
  });
  it("rappelle la provenance, ou compte les plats au-delà de deux", () => {
    expect(formatProvenance([{ plat: "Chili", repas: 3 }, { plat: "Tajine", repas: 1 }])).toBe("Chili ×3 · Tajine ×1");
    expect(formatProvenance([{ plat: "A", repas: 1 }, { plat: "B", repas: 1 }, { plat: "C", repas: 2 }])).toBe("3 plats");
  });
  it("la clé d'un article ignore casse, espaces et unité absente", () => {
    expect(cleArticle({ nom: " Poivrons  rouges", unite: "pièce" })).toBe("poivrons rouges|pièce");
    expect(cleArticle({ nom: "Huile d'olive", unite: null })).toBe("huile d'olive|");
  });
});
