// Poids et tour de taille : une valeur par personne et par semaine, lue en
// tendance lissée, en % du départ. Jamais en kilos côte à côte.
import type { Jour } from "./jours";

export type TypeMesure = "poids" | "tour_taille";

export const FOURCHETTES: Record<TypeMesure, { min: number; max: number; decimales: number }> = {
  poids: { min: 50, max: 110, decimales: 1 },
  tour_taille: { min: 40, max: 200, decimales: 0 },
};

/** Arrondit à la précision du type : kg à une décimale, cm entiers. */
export function normaliserValeur(type: TypeMesure, valeur: number): number {
  const f = 10 ** FOURCHETTES[type].decimales;
  return Math.round(valeur * f) / f;
}

export function valeurValide(type: TypeMesure, valeur: number): boolean {
  const { min, max } = FOURCHETTES[type];
  return Number.isFinite(valeur) && valeur >= min && valeur <= max;
}

/** Lit une saisie : virgule ou point, espaces tolérés. Vide = aucune valeur. */
export function lireValeur(saisie: string): number | null {
  const t = saisie.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export const MESURES_MIN_TENDANCE = 3;
export const FENETRE_LISSAGE = 3;

export type Point = { jour: Jour; valeur: number };
export type PointTendance = Point & { lisse: number; pct: number };

/** Moyenne des dernières valeurs disponibles, trois au plus. */
export function lissage(valeurs: number[], fenetre = FENETRE_LISSAGE): number {
  const fen = valeurs.slice(-fenetre);
  return fen.reduce((a, b) => a + b, 0) / fen.length;
}

/**
 * Courbe d'une personne : lissé sur trois mesures, en % de la première.
 * Vide sous trois mesures, sans message.
 */
export function tendance(points: Point[]): PointTendance[] {
  const tries = [...points].sort((a, b) => a.jour.localeCompare(b.jour));
  if (tries.length < MESURES_MIN_TENDANCE) return [];
  const depart = tries[0].valeur;
  return tries.map((p, i) => {
    const lisse = lissage(tries.slice(0, i + 1).map((q) => q.valeur));
    return { ...p, lisse, pct: ((lisse - depart) / depart) * 100 };
  });
}

/** Les dernières valeurs, la plus récente d'abord, pour l'historique de l'écran 03. */
export function dernieres(points: Point[], n = 3): Point[] {
  return [...points].sort((a, b) => b.jour.localeCompare(a.jour)).slice(0, n);
}
