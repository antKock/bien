// L'activité : une séance par personne, par jour et par créneau, posée le
// dimanche, cochée à la confirmation.

export const ACTIVITES = ["course", "pilates", "renfo", "velo", "autre"] as const;
export type Activite = (typeof ACTIVITES)[number];

export const CRENEAUX = ["matin", "midi", "soir"] as const;
export type Creneau = (typeof CRENEAUX)[number];

export type SeanceInfo = {
  personneId: string;
  activite: Activite;
  /** Obligatoire pour « autre ». */
  nomId: string | null;
  jour: number;
  creneau: Creneau;
  faite: boolean;
};

export type NouvelleSeance = Omit<SeanceInfo, "personneId" | "faite">;

/** « Les deux » crée une séance par personne, identiques par ailleurs. */
export function seancesACreer(
  qui: string[],
  seance: NouvelleSeance,
  faiteParDefaut: boolean,
): SeanceInfo[] {
  if ((seance.activite === "autre") !== (seance.nomId !== null)) {
    throw new RangeError("Une activité « autre » porte un nom, les autres non");
  }
  if (!Number.isInteger(seance.jour) || seance.jour < 1 || seance.jour > 7) {
    throw new RangeError(`Jour ${seance.jour} hors de 1-7`);
  }
  return qui.map((personneId) => ({ ...seance, personneId, faite: faiteParDefaut }));
}

export function resumeActivite(seances: SeanceInfo[]): { posees: number; faites: number } {
  return { posees: seances.length, faites: seances.filter((s) => s.faite).length };
}

/** Le premier jour (1-7) d'une séance encore à venir, pour « la prochaine mercredi ». */
export function prochaineSeance(seances: SeanceInfo[], jourCourant: number): number | null {
  const aVenir = seances.filter((s) => s.jour >= jourCourant).map((s) => s.jour);
  return aVenir.length ? Math.min(...aVenir) : null;
}
