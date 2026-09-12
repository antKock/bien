// Le cycle d'une semaine : à préparer → en cours → à confirmer → clôturée.
// Rien n'est stocké comme état : tout se déduit des horodatages et du jour.
import { ajouterJours, debutDuJour, estLundi, lundiDe, type Jour } from "./jours";

export type SemaineInfo = {
  /** Le lundi. */
  debut: Jour;
  /** Vide = validée automatiquement le dimanche minuit qui précède. */
  valideeLe: Date | null;
  /** Vide = jamais clôturée à la main, ou rouverte. */
  clotureeLe: Date | null;
  rouverteLe: Date[];
  jokersValidesLe: Date | null;
};

export type EtatSemaine = "a_preparer" | "en_cours" | "a_confirmer" | "cloturee";

export class RegleViolee extends Error {}

/** Le dimanche, on prépare la semaine qui contient demain. */
export function debutSemaineAPreparer(aujourdhui: Jour): Jour {
  return lundiDe(ajouterJours(aujourdhui, 1));
}

/** La semaine que l'on confirme un dimanche : celle qui se termine aujourd'hui. */
export function debutSemaineAConfirmer(aujourdhui: Jour): Jour {
  return ajouterJours(debutSemaineAPreparer(aujourdhui), -7);
}

export function dimancheDe(debut: Jour): Jour {
  return ajouterJours(debut, 6);
}

/** Le dimanche où la semaine se prépare : celui qui précède son lundi. */
export function dimanchePreparation(debut: Jour): Jour {
  return ajouterJours(debut, -1);
}

/** Le jour civil du `jour` (1-7) d'une semaine. */
export function dateDuJour(debut: Jour, jour: number): Jour {
  return ajouterJours(debut, jour - 1);
}

export function semaineVierge(debut: Jour): SemaineInfo {
  if (!estLundi(debut)) throw new RegleViolee(`Une semaine commence un lundi : ${debut}`);
  return { debut, valideeLe: null, clotureeLe: null, rouverteLe: [], jokersValidesLe: null };
}

/** L'instant de validation, manuel ou acquis : le lundi 00:00 si personne n'a validé. */
export function seuilPrevu(s: SemaineInfo): Date {
  return s.valideeLe ?? debutDuJour(s.debut);
}

/** Est validée toute semaine validée à la main, ou dont le lundi est arrivé. */
export function estValidee(s: SemaineInfo, aujourdhui: Jour): boolean {
  return s.valideeLe !== null || aujourdhui >= s.debut;
}

export function etatSemaine(s: SemaineInfo, aujourdhui: Jour): EtatSemaine {
  if (s.clotureeLe) return "cloturee";
  if (aujourdhui >= dimancheDe(s.debut)) return "a_confirmer";
  if (estValidee(s, aujourdhui)) return "en_cours";
  return "a_preparer";
}

/** Prévu = créé au plus tard à la validation. Même règle pour plats, jokers et séances. */
export function estNonPrevu(creeLe: Date, s: SemaineInfo): boolean {
  return creeLe.getTime() > seuilPrevu(s).getTime();
}

export function peutModifier(s: SemaineInfo): boolean {
  return s.clotureeLe === null;
}

export function verifierModifiable(s: SemaineInfo): void {
  if (!peutModifier(s)) throw new RegleViolee("Semaine clôturée : rouvrir avant de modifier");
}

// Transitions : chacune rend les champs à écrire, ou refuse.

export function valider(s: SemaineInfo, maintenant: Date, aujourdhui: Jour): Pick<SemaineInfo, "valideeLe"> {
  if (etatSemaine(s, aujourdhui) !== "a_preparer") throw new RegleViolee("Seule une semaine à préparer se valide");
  return { valideeLe: maintenant };
}

export function cloturer(s: SemaineInfo, maintenant: Date, aujourdhui: Jour): Pick<SemaineInfo, "clotureeLe"> {
  if (etatSemaine(s, aujourdhui) !== "a_confirmer") {
    throw new RegleViolee("Une semaine se clôture à partir de son dimanche, une seule fois");
  }
  return { clotureeLe: maintenant };
}

export function rouvrir(s: SemaineInfo, maintenant: Date): Pick<SemaineInfo, "clotureeLe" | "rouverteLe"> {
  if (!s.clotureeLe) throw new RegleViolee("Seule une semaine clôturée se rouvre");
  return { clotureeLe: null, rouverteLe: [...s.rouverteLe, maintenant] };
}

export function validerJokers(s: SemaineInfo, maintenant: Date): Pick<SemaineInfo, "jokersValidesLe"> {
  verifierModifiable(s);
  return { jokersValidesLe: maintenant };
}

// Pastilles de la carte de confirmation.

/** Un sujet est à jour s'il a reçu une écriture depuis le dimanche 00:00 de la semaine. */
export function sujetAJour(dernierGeste: Date | null, s: SemaineInfo): boolean {
  return dernierGeste !== null && dernierGeste.getTime() >= debutDuJour(dimancheDe(s.debut)).getTime();
}

export function jokersAJour(s: SemaineInfo): boolean {
  return sujetAJour(s.jokersValidesLe, s);
}
