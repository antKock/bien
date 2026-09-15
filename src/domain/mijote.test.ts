import { describe, expect, it } from "vitest";
import { dureeDe, lireIngredients, lireLigne, portionsDe, rayonDe, scalabiliteDe } from "./mijote";

describe("durée déduite des temps Mijote", () => {
  it("express si préparation courte et cuisson sous 15 min", () => {
    expect(dureeDe("10-20 min", "< 15 min")).toBe("express");
    expect(dureeDe("< 10 min", "Aucune")).toBe("express");
  });
  it("long dès une heure de cuisson ou plus de 45 min de préparation", () => {
    expect(dureeDe("20-30 min", "1h - 2h")).toBe("long");
    expect(dureeDe("> 45 min", "< 15 min")).toBe("long");
  });
  it("rapide entre les deux, et par défaut quand les temps manquent", () => {
    expect(dureeDe("20-30 min", "15-30 min")).toBe("rapide");
    expect(dureeDe(null, null)).toBe("rapide");
  });
});

describe("scalabilité et portions", () => {
  it("par lot pour ce qui se cuit en une pièce, continu sinon", () => {
    expect(scalabiliteDe("Quiche poireaux-chèvre")).toBe("par_lot");
    expect(scalabiliteDe("Gratin de chou-fleur")).toBe("par_lot");
    expect(scalabiliteDe("Chili con carne")).toBe("continu");
  });
  it("les parts Mijote, 4 à défaut", () => {
    expect(portionsDe(6)).toBe(6);
    expect(portionsDe(null)).toBe(4);
    expect(portionsDe(0)).toBe(4);
  });
});

describe("lecture d'une ligne d'ingrédient", () => {
  it.each([
    ["750 g de bœuf haché 5 %", { nom: "Bœuf haché 5 %", quantite: 750, unite: "g" }],
    ["2 poivrons rouges", { nom: "Poivrons rouges", quantite: 2, unite: "pièce" }],
    ["1 boîte de haricots rouges (400 g)", { nom: "Haricots rouges", quantite: 1, unite: "boîte" }],
    ["20 cl de crème fraîche", { nom: "Crème fraîche", quantite: 20, unite: "cl" }],
    ["2 c. à soupe d'huile d'olive", { nom: "Huile d'olive", quantite: 2, unite: "cs" }],
    ["1/2 oignon", { nom: "Oignon", quantite: 0.5, unite: "pièce" }],
    ["1,5 kg de pommes de terre", { nom: "Pommes de terre", quantite: 1.5, unite: "kg" }],
    ["- 400g de tomates concassées", { nom: "Tomates concassées", quantite: 400, unite: "g" }],
    ["Sel, poivre", { nom: "Sel, poivre", quantite: null, unite: null }],
    ["4 filets de cabillaud", { nom: "Cabillaud", quantite: 4, unite: "filet" }],
  ])("%s", (ligne, attendu) => {
    expect(lireLigne(ligne)).toEqual(attendu);
  });
  it("ignore une ligne vide et les titres de section", () => {
    expect(lireLigne("   ")).toBeNull();
    expect(lireLigne("// Pour le poulet")).toBeNull();
    expect(lireLigne("Pour la sauce :")).toBeNull();
    expect(lireLigne("Pour la pâte")).toBeNull();
  });
});

describe("rayon deviné", () => {
  it.each([
    ["Carottes", null, "primeur"],
    ["Haricots verts", null, "primeur"],
    ["Haricots rouges", "boîte", "epicerie"],
    ["Tomates concassées", "g", "epicerie"],
    ["Lait de coco", "ml", "epicerie"],
    ["Thon", "boîte", "epicerie"],
    ["Bœuf haché 5 %", "g", "boucher"],
    ["Cuisses de poulet", "pièce", "boucher"],
    ["Échalotes hachées", "pièce", "primeur"],
    ["Viande hachée", "g", "boucher"],
    ["Saumon", "pavé", "poissonnier"],
    ["Œufs", "pièce", "cremerie"],
    ["Crème fraîche", "cl", "cremerie"],
    ["Huile d'olive", "cs", "epices_base"],
    ["Paprika fumé", null, "epices_base"],
    ["Sel", null, "epices_base"],
    ["Ail", "gousse", "epices_base"],
    ["Poêlée de légumes surgelée", "g", "surgeles"],
    ["Riz basmati", "g", "epicerie"],
  ])("%s (%s) → %s", (nom, unite, rayon) => {
    expect(rayonDe(nom, unite)).toBe(rayon);
  });
});

describe("le texte Mijote devient les ingrédients de Bien", () => {
  it("garde les quantités, sauf pour « épices & base » qui reste « à vérifier »", () => {
    const l = lireIngredients("750 g de bœuf haché\n2 poivrons rouges\n1 c. à soupe d'huile d'olive\n\nSel");
    expect(l).toEqual([
      { nom: "Bœuf haché", quantite: 750, unite: "g", rayon: "boucher" },
      { nom: "Poivrons rouges", quantite: 2, unite: "pièce", rayon: "primeur" },
      { nom: "Huile d'olive", quantite: null, unite: null, rayon: "epices_base" },
      { nom: "Sel", quantite: null, unite: null, rayon: "epices_base" },
    ]);
  });
  it("un ingrédient sans quantité hors épices reste « à vérifier » dans son rayon", () => {
    expect(lireIngredients("Carottes")).toEqual([{ nom: "Carottes", quantite: null, unite: null, rayon: "primeur" }]);
    expect(lireIngredients(null)).toEqual([]);
  });
});
