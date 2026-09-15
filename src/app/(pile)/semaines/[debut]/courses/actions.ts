"use server";

import { refresh } from "next/cache";
import { ajouterArticleLibre, cocherArticle, retirerArticleLibre } from "@/db/courses";
import { obtenirNom } from "@/db/noms";
import { obtenirSemaine } from "@/db/semaines";
import { verifierModifiable } from "@/domain/semaine";
import { contexteSemaine } from "@/lib/semaines";

/** Coche ou décoche des articles déduits, par leur clé (un article, ou tous ceux d'un plat). */
export async function cocherArticles(debut: string, cles: string[], cochee: boolean): Promise<void> {
  const ctx = await contexteSemaine(debut);
  verifierModifiable(ctx.info);
  const semaine = await obtenirSemaine(ctx.foyer.id, ctx.debut);
  const quand = ctx.maintenant;
  for (const cle of cles) await cocherArticle(semaine.id, cle, cochee, quand);
  refresh();
}

export async function ajouterArticle(debut: string, nom: string): Promise<void> {
  const ctx = await contexteSemaine(debut);
  verifierModifiable(ctx.info);
  const semaine = await obtenirSemaine(ctx.foyer.id, ctx.debut);
  const n = await obtenirNom(ctx.foyer.id, "article", nom);
  await ajouterArticleLibre(semaine.id, n.id, ctx.maintenant);
  refresh();
}

export async function cocherArticleLibre(debut: string, id: string, cochee: boolean): Promise<void> {
  const ctx = await contexteSemaine(debut);
  verifierModifiable(ctx.info);
  const c = ctx.semaine?.courses.find((x) => x.id === id);
  if (c) await cocherArticle(ctx.semaine!.id, c.cle, cochee, ctx.maintenant);
  refresh();
}

export async function retirerArticle(debut: string, id: string): Promise<void> {
  const ctx = await contexteSemaine(debut);
  verifierModifiable(ctx.info);
  if (ctx.semaine) await retirerArticleLibre(ctx.semaine.id, id);
  refresh();
}
