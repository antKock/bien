import { describe, expect, it } from "vitest";
import { echelle, fenetreSemaines, formatPct, tracer } from "./tendances";

describe("fenêtre de semaines", () => {
  it("donne les n dernières semaines jusqu'à celle d'aujourd'hui, la plus ancienne d'abord", () => {
    expect(fenetreSemaines("2025-11-16", 3)).toEqual(["2025-10-27", "2025-11-03", "2025-11-10"]);
    expect(fenetreSemaines("2025-11-18", 2)).toEqual(["2025-11-10", "2025-11-17"]);
  });
});

describe("échelle verticale", () => {
  it("part de 0 et s'étend à l'entier au-delà des valeurs, vers le bas ou vers le haut", () => {
    expect(echelle([0, -2.3, -4.2])).toEqual({ haut: 0, bas: -5 });
    expect(echelle([0, 1.4])).toEqual({ haut: 2, bas: 0 });
    expect(echelle([0, -0.5, 0.5])).toEqual({ haut: 1, bas: -1 });
  });
  it("garde une amplitude d'au moins 1 % quand tout est à zéro", () => {
    expect(echelle([0, 0])).toEqual({ haut: 0, bas: -1 });
  });
});

describe("tracer", () => {
  const p = (jour: string, pct: number) => ({ jour, valeur: 0, lisse: 0, pct });
  it("place le temps en abscisse et le % en ordonnée sur une échelle commune", () => {
    const { traces, echelle: e } = tracer(
      [{ points: [p("2025-11-02", 0), p("2025-11-16", -2)] }, { points: [p("2025-11-09", -1)] }],
      300,
      110,
      8,
    );
    expect(e).toEqual({ haut: 0, bas: -2 });
    expect(traces[0].points).toEqual([
      { x: 0, y: 8 },
      { x: 300, y: 102 },
    ]);
    expect(traces[1].points).toEqual([{ x: 150, y: 55 }]);
  });
  it("une semaine sans mesure n'ajoute pas de point : la ligne traverse le trou", () => {
    const { traces } = tracer([{ points: [p("2025-11-02", 0), p("2025-11-23", -3)] }], 300, 110);
    expect(traces[0].points).toHaveLength(2);
  });
});

describe("formatPct", () => {
  it("écrit le signe typographique et une décimale", () => {
    expect(formatPct(-4.23)).toBe("−4,2 %");
    expect(formatPct(0)).toBe("0 %");
    expect(formatPct(1.5)).toBe("+1,5 %");
  });
});
