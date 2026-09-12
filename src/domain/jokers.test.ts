import { describe, expect, it } from "vitest";
import {
  BUDGET_JOKERS,
  bilanJokers,
  coutParJour,
  coutSoiree,
  coutTotal,
  decocher,
  frequenceTypes,
  jauge,
  type EcartInfo,
  type TypeEcart,
} from "./jokers";
import { semaineVierge, type SemaineInfo } from "./semaine";

// Semaine du 17 au 23 des maquettes, validée le dimanche 16 à 16 h.
const S17: SemaineInfo = { ...semaineVierge("2025-11-17"), valideeLe: new Date("2025-11-16T15:00:00Z") };
const POSE = new Date("2025-11-16T14:30:00Z"); // le dimanche d'avant
const CONFIRME = new Date("2025-11-23T13:00:00Z"); // le dimanche suivant

const ecart = (jour: number, type: TypeEcart, creeLe = POSE, retireLe: Date | null = null): EcartInfo => ({
  jour,
  type,
  creeLe,
  retireLe,
});

describe("coût d'une soirée : ½ par écart, plafonné à 1", () => {
  it.each([
    [0, 0],
    [1, 0.5],
    [2, 1],
    [3, 1],
    [5, 1],
  ])("%i écart(s) → %s", (n, cout) => {
    expect(coutSoiree(n)).toBe(cout);
  });

  it("apéro crudités + un verre de vin + dîner conforme = ½", () => {
    expect(coutTotal([ecart(2, "alcool")])).toBe(0.5);
  });
  it("saucisson + alcool + dîner conforme = 1", () => {
    expect(coutTotal([ecart(2, "apero_riche"), ecart(2, "alcool")])).toBe(1);
  });
  it("soirée complète (saucisson, alcool, gros plat) = 1, le plafond", () => {
    expect(coutTotal([ecart(6, "apero_riche"), ecart(6, "alcool"), ecart(6, "repas_riche")])).toBe(1);
  });
  it("une pâtisserie un mardi = ½ ; « autre » coûte comme les autres", () => {
    expect(coutTotal([ecart(2, "extra_sucre")])).toBe(0.5);
    expect(coutTotal([ecart(2, "extra_sucre"), ecart(2, "autre")])).toBe(1);
  });
});

describe("la grille des maquettes", () => {
  it("écran 14 : mar 1, jeu ½, sam ½ → 2", () => {
    const grille = [ecart(2, "apero_riche"), ecart(2, "alcool"), ecart(4, "repas_riche"), ecart(6, "alcool")];
    expect(coutParJour(grille)).toEqual([0, 1, 0, 0.5, 0, 0.5, 0]);
    expect(coutTotal(grille)).toBe(2);
  });
  it("écran 16 : cocher la 3ᵉ puis la 4ᵉ case du samedi ne change rien", () => {
    const deux = [ecart(6, "apero_riche"), ecart(6, "alcool")];
    const quatre = [...deux, ecart(6, "repas_riche"), ecart(6, "extra_sucre")];
    expect(coutTotal(deux)).toBe(1);
    expect(coutTotal(quatre)).toBe(1);
  });
  it("écran 17 : sept soirs sortis du cadre, le total dépasse 3 sans rien casser", () => {
    const grille = [
      ecart(1, "alcool"),
      ecart(2, "apero_riche"),
      ecart(2, "alcool"),
      ecart(3, "extra_sucre"),
      ecart(4, "repas_riche"),
      ecart(4, "alcool"),
      ecart(5, "apero_riche"),
      ecart(5, "repas_riche"),
      ecart(6, "apero_riche"),
      ecart(6, "alcool"),
      ecart(7, "autre"),
    ];
    expect(coutTotal(grille)).toBe(5.5);
    expect(jauge(5.5, 0)).toEqual(["consomme", "consomme", "consomme", "au_dela", "au_dela", "au_dela"]);
  });
});

describe("posé, consommé, improvisé", () => {
  // Posés le dimanche 16 : resto jeudi, raclette + vin samedi. Soit 1,5.
  const poses = [ecart(4, "repas_riche"), ecart(6, "repas_riche"), ecart(6, "alcool")];

  it("le dimanche d'avant, tout est posé, rien n'est consommé", () => {
    expect(bilanJokers(poses, S17, "2025-11-16")).toEqual({
      pose: 1.5,
      consomme: 0,
      improvise: 0,
      aVenir: 1.5,
      soirees: 2,
    });
  });

  it("le mardi, une soirée passée est consommée, le reste est à venir", () => {
    const grille = [...poses, ecart(1, "alcool")]; // lundi, posé aussi
    expect(bilanJokers(grille, S17, "2025-11-18")).toMatchObject({ pose: 2, consomme: 0.5, aVenir: 1.5 });
  });

  it("le dimanche suivant : un écart ajouté est improvisé, un écart retiré reste posé", () => {
    const grille = [
      ecart(4, "repas_riche"),
      ecart(4, "alcool", CONFIRME), // vin au resto, non prévu : jeudi passe de ½ à 1
      ecart(6, "repas_riche", POSE, CONFIRME), // raclette annulée : retirée, pas supprimée
      ecart(6, "alcool"),
      ecart(2, "extra_sucre", CONFIRME), // pâtisserie mardi, improvisée
    ];
    expect(bilanJokers(grille, S17, "2025-11-23")).toEqual({
      pose: 1.5, // jeudi ½ + samedi 1, tel que posé
      consomme: 2, // jeudi 1 + samedi ½ + mardi ½
      improvise: 1, // le vin de jeudi (½) et la pâtisserie (½)
      aVenir: 0,
      soirees: 3,
    });
  });

  it("une semaine clôturée compte tout comme consommé, quelle que soit la date", () => {
    const close = { ...S17, clotureeLe: CONFIRME };
    expect(bilanJokers(poses, close, "2025-11-16")).toMatchObject({ consomme: 1.5, aVenir: 0 });
  });

  it("le dimanche soir de la semaine se confirme le dimanche même", () => {
    expect(bilanJokers([ecart(7, "autre", CONFIRME)], S17, "2025-11-23")).toMatchObject({ consomme: 0.5, aVenir: 0 });
  });
});

describe("la jauge de trois jetons", () => {
  it("est libre quand rien n'est posé", () => {
    expect(BUDGET_JOKERS).toBe(3);
    expect(jauge(0, 0)).toEqual(["libre", "libre", "libre"]);
  });
  it("écran 04 : 1,5 posé → un jeton posé, un demi… en contour, un libre", () => {
    expect(jauge(0, 1.5)).toEqual(["pose", "pose", "libre"]);
  });
  it("écran 12 : 1 consommé, 2 encore à venir", () => {
    expect(jauge(1, 2)).toEqual(["consomme", "pose", "pose"]);
  });
  it("remplit le consommé d'abord, un demi-jeton consommé se lit « demi »", () => {
    expect(jauge(0.5, 1)).toEqual(["demi", "pose", "libre"]);
    expect(jauge(1.5, 0)).toEqual(["consomme", "demi", "libre"]);
  });
  it("au-delà du budget, les jetons s'ajoutent à la file", () => {
    expect(jauge(3.5, 0)).toEqual(["consomme", "consomme", "consomme", "au_dela"]);
    expect(jauge(2, 2)).toEqual(["consomme", "consomme", "pose", "au_dela"]);
  });
});

describe("décocher", () => {
  it("retire un écart prévu, supprime un écart improvisé", () => {
    expect(decocher(ecart(4, "repas_riche"), S17, "2025-11-23")).toBe("retirer");
    expect(decocher(ecart(4, "alcool", CONFIRME), S17, "2025-11-23")).toBe("supprimer");
  });
  it("avant validation, tout écart se supprime", () => {
    const aPreparer = semaineVierge("2025-11-24");
    const pose = ecart(4, "repas_riche", new Date("2025-11-23T14:00:00Z"));
    expect(decocher(pose, aPreparer, "2025-11-23")).toBe("supprimer");
    // Le lundi, la validation est acquise : le même écart se retire.
    expect(decocher(pose, aPreparer, "2025-11-24")).toBe("retirer");
  });
});

describe("fréquence des types (Tendances)", () => {
  it("compte les écarts présents, pas les retirés", () => {
    const f = frequenceTypes([ecart(1, "alcool"), ecart(3, "alcool"), ecart(3, "autre"), ecart(5, "alcool", POSE, CONFIRME)]);
    expect(f).toEqual({ apero_riche: 0, alcool: 2, repas_riche: 0, extra_sucre: 0, autre: 1 });
  });
});
