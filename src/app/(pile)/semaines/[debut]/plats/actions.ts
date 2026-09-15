"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { obtenirNom } from "@/db/noms";
import { ajouterPlatLibre, ajouterPlatRecette, majPlat, retirerPlat, toutCocherPlats } from "@/db/plats";
import { obtenirSemaine } from "@/db/semaines";
import { repasCuisinesApresCoche, repasCuisinesApresStepper, repasValide, REPAS_MAX } from "@/domain/plats";
import { estValidee, verifierModifiable } from "@/domain/semaine";
import { maintenant } from "@/lib/dates";
import { contexteSemaine } from "@/lib/semaines";

/** Ajoute les recettes cochées et, s'il y en a un, le plat libre nommé ; après validation, tout naît cuisiné. */
export async function ajouterPlats(debut: string, recetteIds: string[], platLibre: string | null): Promise<void> {
  const ctx = await contexteSemaine(debut);
  verifierModifiable(ctx.info);
  const semaine = await obtenirSemaine(ctx.foyer.id, ctx.debut);
  const cuisines = estValidee(ctx.info, ctx.jour) ? 1 : 0;
  const quand = maintenant();
  for (const id of recetteIds) await ajouterPlatRecette(semaine.id, id, cuisines, quand);
  if (platLibre) {
    const nom = await obtenirNom(ctx.foyer.id, "plat_libre", platLibre);
    await ajouterPlatLibre(semaine.id, nom.id, cuisines, quand);
  }
  redirect(`/semaines/${ctx.debut}/plats`);
}

/** Le stepper : de 1 à 4 ; « − » à ×1 retire le plat. Préparation seulement. */
export async function changerRepas(debut: string, id: string, delta: 1 | -1): Promise<void> {
  const ctx = await contexteSemaine(debut);
  verifierModifiable(ctx.info);
  const plat = ctx.semaine?.plats.find((p) => p.id === id);
  if (!plat) return;
  const repas = plat.repas + delta;
  if (repas < 1) await retirerPlat(ctx.semaine!.id, id);
  else if (repasValide(repas) && repas <= REPAS_MAX) {
    await majPlat(ctx.semaine!.id, id, { repas, repasCuisines: repasCuisinesApresStepper(plat, repas) }, maintenant());
  }
  refresh();
}

export async function cocherRepas(debut: string, id: string, n: number, coche: boolean): Promise<void> {
  const ctx = await contexteSemaine(debut);
  verifierModifiable(ctx.info);
  const plat = ctx.semaine?.plats.find((p) => p.id === id);
  if (!plat) return;
  await majPlat(ctx.semaine!.id, id, { repasCuisines: repasCuisinesApresCoche(plat, n, coche) }, maintenant());
  refresh();
}

export async function toutCocher(debut: string): Promise<void> {
  const ctx = await contexteSemaine(debut);
  verifierModifiable(ctx.info);
  if (ctx.semaine) await toutCocherPlats(ctx.semaine.id, maintenant());
  refresh();
}
