"use server";

import { refresh } from "next/cache";
import { enregistrerMesure } from "@/db/mesures";
import { obtenirSemaine } from "@/db/semaines";
import { FOURCHETTES, lireValeur, normaliserValeur, valeurValide, type TypeMesure } from "@/domain/mesures";
import { verifierModifiable } from "@/domain/semaine";
import { maintenant } from "@/lib/dates";
import { contexteSemaine } from "@/lib/semaines";

export type RetourMesure = { erreur?: string };

const UNITES: Record<TypeMesure, string> = { poids: "kg", tour_taille: "cm" };

/** Une valeur tapée est enregistrée ; vide, elle efface ; hors fourchette, rien ne change et une ligne le dit. */
export async function noterMesure(
  debut: string,
  personneId: string,
  type: TypeMesure,
  saisie: string,
): Promise<RetourMesure> {
  const ctx = await contexteSemaine(debut);
  verifierModifiable(ctx.info);
  if (!ctx.personnes.some((p) => p.id === personneId)) throw new Error("Personne inconnue");

  const brut = lireValeur(saisie);
  let valeur: number | null = null;
  if (brut !== null) {
    if (!valeurValide(type, brut)) {
      const { min, max } = FOURCHETTES[type];
      return { erreur: `Entre ${min} et ${max} ${UNITES[type]}.` };
    }
    valeur = normaliserValeur(type, brut);
  }
  const semaine = await obtenirSemaine(ctx.foyer.id, ctx.debut);
  await enregistrerMesure(semaine.id, personneId, type, valeur, maintenant());
  refresh();
  return {};
}
