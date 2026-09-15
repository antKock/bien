// Les jokers : une unité de fréquence, pas d'énergie. L'entité est l'écart
// (une case de la grille 7 × 5) ; le coût d'une soirée se déduit.
import { jourSemaine, type Jour } from "./jours";
import { dateDuJour, estNonPrevu, estValidee, type SemaineInfo } from "./semaine";

export const BUDGET_JOKERS = 3;

export const TYPES_ECART = ["apero_riche", "alcool", "repas_riche", "extra_sucre", "autre"] as const;
export type TypeEcart = (typeof TYPES_ECART)[number];

export type EcartInfo = {
  /** 1 = lundi … 7 = dimanche. */
  jour: number;
  type: TypeEcart;
  creeLe: Date;
  /** Posé, décoché après validation : retiré mais gardé pour la trace. */
  retireLe: Date | null;
};

/** ½ par écart, plafonné à 1 par soirée. */
export function coutSoiree(nbEcarts: number): number {
  if (nbEcarts <= 0) return 0;
  return nbEcarts === 1 ? 0.5 : 1;
}

export const estPresent = (e: EcartInfo) => e.retireLe === null;

/** Coût de chaque soirée, index 0 = lundi, pour un ensemble d'écarts. */
export function coutParJour(ecarts: EcartInfo[]): number[] {
  const nb = Array<number>(7).fill(0);
  for (const e of ecarts) nb[e.jour - 1] += 1;
  return nb.map(coutSoiree);
}

export function coutTotal(ecarts: EcartInfo[]): number {
  return coutParJour(ecarts).reduce((a, b) => a + b, 0);
}

export type BilanJokers = {
  /** Coût des écarts prévus, retirés compris : ce qui avait été posé. */
  pose: number;
  /** Coût des soirées présentes déjà passées (toutes si clôturée). */
  consomme: number;
  /** Part du consommé qui n'avait pas été posée. */
  improvise: number;
  /** Coût des soirées présentes encore à venir : posé, pas encore consommé. */
  aVenir: number;
  /** Soirées présentes dont le coût dépasse 0. */
  soirees: number;
};

/** Une case de la grille telle que l'écran la connaît, sans horodatage. */
export type CaseGrille = { jour: number; type: TypeEcart; present: boolean; prevu: boolean };

export function caseDe(e: EcartInfo, s: SemaineInfo): CaseGrille {
  return { jour: e.jour, type: e.type, present: estPresent(e), prevu: !estNonPrevu(e.creeLe, s) };
}

const coutCases = (cases: CaseGrille[]) =>
  coutParJour(cases.map((c) => ({ jour: c.jour, type: c.type, creeLe: new Date(0), retireLe: null }))).reduce(
    (a, b) => a + b,
    0,
  );

/**
 * Bilan sur des cases : `jourCourant` est le dernier jour (1-7) considéré comme
 * passé, 0 si la semaine n'a pas commencé, 7 si elle est finie ou clôturée.
 */
export function bilanCases(cases: CaseGrille[], jourCourant: number): BilanJokers {
  const presents = cases.filter((c) => c.present);
  const consommes = presents.filter((c) => c.jour <= jourCourant);
  const consomme = coutCases(consommes);
  return {
    pose: coutCases(cases.filter((c) => c.prevu)),
    consomme,
    improvise: consomme - coutCases(consommes.filter((c) => c.prevu)),
    aVenir: coutCases(presents.filter((c) => c.jour > jourCourant)),
    soirees: coutParJour(
      presents.map((c) => ({ jour: c.jour, type: c.type, creeLe: new Date(0), retireLe: null })),
    ).filter((x) => x > 0).length,
  };
}

/** Le dernier jour passé de la semaine : 0 avant son lundi, 7 après son dimanche ou si clôturée. */
export function jourCourantDe(s: SemaineInfo, aujourdhui: Jour): number {
  if (s.clotureeLe !== null || aujourdhui > dateDuJour(s.debut, 7)) return 7;
  if (aujourdhui < s.debut) return 0;
  return jourSemaine(aujourdhui);
}

export function bilanJokers(ecarts: EcartInfo[], s: SemaineInfo, aujourdhui: Jour): BilanJokers {
  return bilanCases(
    ecarts.map((e) => caseDe(e, s)),
    jourCourantDe(s, aujourdhui),
  );
}

// La jauge : trois jetons, remplis par demi-unités, consommé d'abord puis
// posé. Au-delà du budget, les jetons s'ajoutent à la file.

export type Jeton = { etat: "consomme" | "pose" | "libre" | "au_dela"; moitie: boolean };

export function jauge(consomme: number, aVenir: number, budget = BUDGET_JOKERS): Jeton[] {
  const moities: ("c" | "p")[] = [
    ...Array<"c">(Math.round(consomme * 2)).fill("c"),
    ...Array<"p">(Math.round(aVenir * 2)).fill("p"),
  ];
  const nbJetons = Math.max(budget, Math.ceil(moities.length / 2));
  const jetons: Jeton[] = [];
  for (let i = 0; i < nbJetons; i++) {
    const [a, b] = [moities[2 * i], moities[2 * i + 1]];
    const moitie = a !== undefined && b === undefined;
    if (i >= budget) jetons.push({ etat: "au_dela", moitie });
    else if (a === "c") jetons.push({ etat: "consomme", moitie: b !== "c" });
    else if (a === "p") jetons.push({ etat: "pose", moitie });
    else jetons.push({ etat: "libre", moitie: false });
  }
  return jetons;
}

/**
 * Décocher : tant que la semaine n'est pas validée, on supprime. Ensuite un
 * écart prévu se retire (trace) et un écart improvisé se supprime.
 */
export function decocher(e: EcartInfo, s: SemaineInfo, aujourdhui: Jour): "retirer" | "supprimer" {
  if (!estValidee(s, aujourdhui)) return "supprimer";
  return estNonPrevu(e.creeLe, s) ? "supprimer" : "retirer";
}

/** Fréquence de chaque type parmi les écarts présents, pour Tendances. */
export function frequenceTypes(ecarts: EcartInfo[]): Record<TypeEcart, number> {
  const f = Object.fromEntries(TYPES_ECART.map((t) => [t, 0])) as Record<TypeEcart, number>;
  for (const e of ecarts) if (estPresent(e)) f[e.type] += 1;
  return f;
}
