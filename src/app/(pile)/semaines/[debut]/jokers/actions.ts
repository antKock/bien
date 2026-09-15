"use server";

import { refresh } from "next/cache";
import { creerEcart, ecartExistant, reprendreEcart, retirerEcart, supprimerEcart } from "@/db/ecarts";
import { obtenirNom } from "@/db/noms";
import { majSemaine, obtenirSemaine } from "@/db/semaines";
import { decocher, TYPES_ECART, type TypeEcart } from "@/domain/jokers";
import { validerJokers, verifierModifiable } from "@/domain/semaine";
import { maintenant } from "@/lib/dates";
import { contexteSemaine } from "@/lib/semaines";

/**
 * Une case de la grille : la cocher crée l'écart (ou annule son retrait), la
 * décocher le retire s'il était prévu, le supprime sinon. « autre » porte un nom.
 */
export async function basculerEcart(debut: string, jour: number, type: TypeEcart, nom: string | null): Promise<void> {
  const ctx = await contexteSemaine(debut);
  verifierModifiable(ctx.info);
  if (!Number.isInteger(jour) || jour < 1 || jour > 7 || !TYPES_ECART.includes(type)) throw new Error("Case inconnue");

  const semaine = await obtenirSemaine(ctx.foyer.id, ctx.debut);
  const existant = await ecartExistant(semaine.id, jour, type);
  const nomId = async () => {
    if (type !== "autre") return null;
    if (!nom) throw new Error("« Autre » demande un nom");
    return (await obtenirNom(ctx.foyer.id, "autre", nom)).id;
  };

  if (!existant) await creerEcart(semaine.id, jour, type, await nomId(), maintenant());
  else if (existant.retireLe) await reprendreEcart(existant.id, await nomId(), maintenant());
  else if (decocher({ ...existant, creeLe: existant.creeLe, retireLe: null }, ctx.info, ctx.jour) === "retirer") {
    await retirerEcart(existant.id, maintenant());
  } else await supprimerEcart(existant.id);
  refresh();
}

/** Le geste « Valider » de la grille en confirmation : « j'ai relu ». */
export async function validerGrille(debut: string): Promise<void> {
  const ctx = await contexteSemaine(debut);
  const semaine = await obtenirSemaine(ctx.foyer.id, ctx.debut);
  await majSemaine(semaine.id, validerJokers(ctx.info, maintenant()));
  refresh();
}
