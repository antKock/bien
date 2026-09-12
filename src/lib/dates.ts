// Formats d'affichage des dates. Le calendrier lui-même (jours civils, lundis,
// minuit à Paris) vit dans `domain/jours` ; ici on ne fait que l'écrire.
import { FUSEAU, ajouterJours, jourDe, type Jour } from "@/domain/jours";

export { FUSEAU };

const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const JOURS_LONGS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

/** « dimanche 16 novembre » */
export function formatJourLong(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: FUSEAU }).format(
    date,
  );
}

export function jourLong(jour: Jour): string {
  return formatJourLong(new Date(`${jour}T12:00:00Z`));
}

/** Le jour civil courant à Paris. `BIEN_AUJOURDHUI` le fixe en développement, pour rejouer un dimanche. */
export function aujourdhui(): Jour {
  return process.env.BIEN_AUJOURDHUI || jourDe(new Date());
}

function partsDe(jour: Jour): { annee: number; mois: number; num: number } {
  const [annee, mois, num] = jour.split("-").map(Number);
  return { annee, mois, num };
}

/** « 17 », « 1ᵉʳ », et avec le mois « 29 sept. » */
export function numeroDuJour(jour: Jour, avecMois = false): string {
  const { mois, num } = partsDe(jour);
  const n = num === 1 ? "1ᵉʳ" : String(num);
  return avecMois ? `${n} ${MOIS_COURTS[mois - 1]}` : n;
}

/**
 * « du 17 au 23 » ; avec le mois si la semaine en change ou si on le demande :
 * « du 29 sept. au 5 oct. », « du 10 au 16 nov. ».
 */
export function nomSemaine(debut: Jour, avecMois = false): string {
  const fin = ajouterJours(debut, 6);
  const change = partsDe(debut).mois !== partsDe(fin).mois;
  if (change) return `du ${numeroDuJour(debut, true)} au ${numeroDuJour(fin, true)}`;
  return `du ${numeroDuJour(debut)} au ${numeroDuJour(fin, avecMois)}`;
}

/** « dimanche 16 » */
export function jourAvecNom(jour: Jour): string {
  const d = new Date(`${jour}T12:00:00Z`).getUTCDay();
  return `${JOURS_LONGS[(d + 6) % 7]} ${numeroDuJour(jour)}`;
}

/** « 9 nov » pour l'historique des mesures. */
export function jourCourt(jour: Jour): string {
  return numeroDuJour(jour, true).replace(".", "");
}

export const JOURS_ABREGES = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

/** 1-7 → « mercredi » */
export function nomDuJour(n: number): string {
  return JOURS_LONGS[n - 1];
}
