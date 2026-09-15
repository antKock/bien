// L'onglet Tendances : le seul endroit qui regarde au-delà d'une semaine.
// Ici, seulement la géométrie de la courbe et les fenêtres de semaines ;
// lissage et % du départ sont dans `mesures`, les bilans dans `jokers`.
import { ajouterJours, lundiDe, type Jour } from "./jours";
import type { PointTendance } from "./mesures";

/** Les `n` dernières semaines (lundis) jusqu'à celle qui contient `aujourdhui`, la plus ancienne d'abord. */
export function fenetreSemaines(aujourdhui: Jour, n: number): Jour[] {
  const derniere = lundiDe(aujourdhui);
  return Array.from({ length: n }, (_, i) => ajouterJours(derniere, -7 * (n - 1 - i)));
}

export type Echelle = { haut: number; bas: number };

/** L'axe vertical : toujours 0 %, étendu à l'entier au-delà des valeurs, au moins 1 % d'amplitude. */
export function echelle(pcts: number[]): Echelle {
  const haut = Math.max(0, Math.ceil(Math.max(0, ...pcts)));
  const bas = Math.min(0, Math.floor(Math.min(0, ...pcts)));
  return haut === bas ? { haut, bas: bas - 1 } : { haut, bas };
}

export type Serie = { points: PointTendance[] };
export type Trace = { points: { x: number; y: number }[] };

/**
 * Projette les séries dans un repère `largeur × hauteur` : le temps en
 * abscisse (du premier au dernier jour, toutes séries confondues), le % en
 * ordonnée sur l'échelle commune. Une semaine sans mesure est un trou que la
 * ligne traverse.
 */
export function tracer(series: Serie[], largeur: number, hauteur: number, marge = 8): { traces: Trace[]; echelle: Echelle } {
  const tous = series.flatMap((s) => s.points);
  const e = echelle(tous.map((p) => p.pct));
  const jours = tous.map((p) => p.jour).sort();
  const debut = jours[0];
  const fin = jours.at(-1);
  const etendue = debut && fin && fin !== debut ? joursEntre(debut, fin) : 1;
  const utile = hauteur - 2 * marge;
  const traces = series.map((s) => ({
    points: s.points.map((p) => ({
      x: debut ? Math.round((joursEntre(debut, p.jour) / etendue) * largeur * 10) / 10 : 0,
      y: Math.round((marge + ((e.haut - p.pct) / (e.haut - e.bas)) * utile) * 10) / 10,
    })),
  }));
  return { traces, echelle: e };
}

function joursEntre(a: Jour, b: Jour): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** « −4,2 % » */
export function formatPct(pct: number): string {
  const v = Math.round(pct * 10) / 10;
  const signe = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${signe}${String(Math.abs(v)).replace(".", ",")} %`;
}
