"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { obtenirNom } from "@/db/noms";
import { ajouterSeances, cocherSeance, retirerSeance, toutCocherSeances } from "@/db/seances";
import { obtenirSemaine } from "@/db/semaines";
import { seancesACreer, type Activite, type Creneau } from "@/domain/activite";
import { estValidee, verifierModifiable } from "@/domain/semaine";
import { contexteSemaine } from "@/lib/semaines";

export type NouvelleSeanceSaisie = {
  qui: string[];
  activite: Activite;
  nom: string | null;
  jour: number;
  creneau: Creneau;
};

/** Ajoute une séance par personne choisie ; après validation, elle naît faite et porte « non prévu ». */
export async function ajouterSeance(debut: string, saisie: NouvelleSeanceSaisie): Promise<void> {
  const ctx = await contexteSemaine(debut);
  verifierModifiable(ctx.info);
  const qui = saisie.qui.filter((id) => ctx.personnes.some((p) => p.id === id));
  if (qui.length === 0) throw new Error("Personne inconnue");
  const nomId = saisie.activite === "autre" && saisie.nom ? (await obtenirNom(ctx.foyer.id, "activite", saisie.nom)).id : null;
  const seances = seancesACreer(
    qui,
    { activite: saisie.activite, nomId, jour: saisie.jour, creneau: saisie.creneau },
    estValidee(ctx.info, ctx.jour),
  );
  const semaine = await obtenirSemaine(ctx.foyer.id, ctx.debut);
  await ajouterSeances(semaine.id, seances);
  redirect(`/semaines/${ctx.debut}/activite`);
}

export async function retirer(debut: string, id: string): Promise<void> {
  const ctx = await contexteSemaine(debut);
  verifierModifiable(ctx.info);
  if (estValidee(ctx.info, ctx.jour)) throw new Error("Après validation, on décoche, on ne retire pas");
  if (ctx.semaine) await retirerSeance(ctx.semaine.id, id);
  refresh();
}

export async function cocher(debut: string, id: string, faite: boolean): Promise<void> {
  const ctx = await contexteSemaine(debut);
  verifierModifiable(ctx.info);
  if (ctx.semaine) await cocherSeance(ctx.semaine.id, id, faite);
  refresh();
}

export async function toutCocher(debut: string): Promise<void> {
  const ctx = await contexteSemaine(debut);
  verifierModifiable(ctx.info);
  if (ctx.semaine) await toutCocherSeances(ctx.semaine.id);
  refresh();
}
