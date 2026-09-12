// Les jokers : une unité de fréquence, pas d'énergie. L'entité est l'écart
// (une case de la grille 7 × 5) ; le coût d'une soirée se déduit.
import { dateDuJour, estNonPrevu, estValidee, type SemaineInfo } from "./semaine";
import type { Jour } from "./jours";

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

export function bilanJokers(ecarts: EcartInfo[], s: SemaineInfo, aujourdhui: Jour): BilanJokers {
  const prevus = ecarts.filter((e) => !estNonPrevu(e.creeLe, s));
  const presents = ecarts.filter(estPresent);
  const passe = (e: EcartInfo) => s.clotureeLe !== null || dateDuJour(s.debut, e.jour) <= aujourdhui;
  const consommes = presents.filter(passe);
  const consomme = coutTotal(consommes);
  return {
    pose: coutTotal(prevus),
    consomme,
    improvise: consomme - coutTotal(consommes.filter((e) => !estNonPrevu(e.creeLe, s))),
    aVenir: coutTotal(presents.filter((e) => !passe(e))),
    soirees: coutParJour(presents).filter((c) => c > 0).length,
  };
}

// La jauge : trois jetons, remplis par demi-unités, consommé d'abord puis
// posé. Au-delà du budget, les jetons s'ajoutent à la file.

export type Jeton = "consomme" | "demi" | "pose" | "libre" | "au_dela";

export function jauge(consomme: number, aVenir: number, budget = BUDGET_JOKERS): Jeton[] {
  const moities: ("c" | "p")[] = [
    ...Array<"c">(Math.round(consomme * 2)).fill("c"),
    ...Array<"p">(Math.round(aVenir * 2)).fill("p"),
  ];
  const nbJetons = Math.max(budget, Math.ceil(moities.length / 2));
  const jetons: Jeton[] = [];
  for (let i = 0; i < nbJetons; i++) {
    const [a, b] = [moities[2 * i], moities[2 * i + 1]];
    if (i >= budget) jetons.push("au_dela");
    else if (a === "c" && b === "c") jetons.push("consomme");
    else if (a === "c") jetons.push("demi");
    else if (a === "p") jetons.push("pose");
    else jetons.push("libre");
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
