import { describe, expect, it } from "vitest";
import { dernieres, lireValeur, lissage, normaliserValeur, tendance, valeurValide } from "./mesures";

describe("saisie d'une mesure", () => {
  it("accepte la virgule, le point et les espaces ; vide = rien", () => {
    expect(lireValeur(" 94,2 ")).toBe(94.2);
    expect(lireValeur("94.2")).toBe(94.2);
    expect(lireValeur("")).toBeNull();
    expect(lireValeur("abc")).toBeNull();
  });
  it("arrondit le poids au dixième et le tour de taille à l'unité", () => {
    expect(normaliserValeur("poids", 94.24)).toBe(94.2);
    expect(normaliserValeur("poids", 94.25)).toBe(94.3);
    expect(normaliserValeur("tour_taille", 93.6)).toBe(94);
  });
  it("borne le poids de 50 à 110 kg et le tour de taille de 40 à 200 cm", () => {
    expect(valeurValide("poids", 50)).toBe(true);
    expect(valeurValide("poids", 110)).toBe(true);
    expect(valeurValide("poids", 49.9)).toBe(false);
    expect(valeurValide("poids", 110.1)).toBe(false);
    expect(valeurValide("tour_taille", 94)).toBe(true);
    expect(valeurValide("tour_taille", 39)).toBe(false);
    expect(valeurValide("poids", Number.NaN)).toBe(false);
  });
});

describe("tendance : lissée sur trois mesures, en % du départ", () => {
  const points = [
    { jour: "2025-10-26", valeur: 100 },
    { jour: "2025-11-02", valeur: 99 },
    { jour: "2025-11-09", valeur: 98 },
    { jour: "2025-11-16", valeur: 96 },
  ];

  it("le lissage est la moyenne des trois dernières valeurs disponibles", () => {
    expect(lissage([100])).toBe(100);
    expect(lissage([100, 99])).toBe(99.5);
    expect(lissage([100, 99, 98, 96])).toBe(97.66666666666667);
  });

  it("le départ est la première mesure ; chaque point est lissé puis rapporté au départ", () => {
    const t = tendance(points);
    expect(t.map((p) => p.lisse)).toEqual([100, 99.5, 99, 97.66666666666667]);
    expect(t.map((p) => Math.round(p.pct * 100) / 100)).toEqual([0, -0.5, -1, -2.33]);
  });

  it("reste vide sous trois mesures, sans message", () => {
    expect(tendance(points.slice(0, 2))).toEqual([]);
    expect(tendance(points.slice(0, 3))).toHaveLength(3);
  });

  it("trie par date quelle que soit l'entrée", () => {
    expect(tendance([...points].reverse())[0].jour).toBe("2025-10-26");
  });

  it("l'historique de l'écran 03 donne les trois dernières, la plus récente d'abord", () => {
    expect(dernieres(points).map((p) => p.valeur)).toEqual([96, 98, 99]);
  });
});
