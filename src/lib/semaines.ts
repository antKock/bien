import { notFound } from "next/navigation";
import { personnesDuFoyer } from "@/db/personnes";
import type { Foyer, Personne } from "@/db/schema";
import { infoDe, semaineParDebut, type SemaineChargee } from "@/db/semaines";
import { estLundi, type Jour } from "@/domain/jours";
import { etatSemaine, semaineVierge, type EtatSemaine, type SemaineInfo } from "@/domain/semaine";
import { aujourdhui } from "@/lib/dates";
import { foyerCourant } from "@/lib/foyer-courant";

// Le contexte d'un écran de sujet : le foyer, la semaine visée (ligne ou
// vierge), son état aujourd'hui, et les deux personnes.
export type ContexteSemaine = {
  foyer: Foyer;
  debut: Jour;
  semaine: SemaineChargee | null;
  info: SemaineInfo;
  etat: EtatSemaine;
  personnes: Personne[];
  jour: Jour;
};

const FORMAT_JOUR = /^\d{4}-\d{2}-\d{2}$/;

export function debutValide(param: string): Jour {
  if (!FORMAT_JOUR.test(param) || !estLundi(param)) notFound();
  return param;
}

export async function contexteSemaine(param: string): Promise<ContexteSemaine> {
  const foyer = await foyerCourant();
  if (!foyer) notFound();
  const debut = debutValide(param);
  const [semaine, personnes] = await Promise.all([semaineParDebut(foyer.id, debut), personnesDuFoyer(foyer.id)]);
  const info = semaine ? infoDe(semaine) : semaineVierge(debut);
  const jour = aujourdhui();
  return { foyer, debut, semaine, info, etat: etatSemaine(info, jour), personnes, jour };
}
