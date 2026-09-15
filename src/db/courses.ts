import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { course } from "./schema";

/** Cocher ou décocher un article de la liste ; la ligne naît à la première coche. */
export async function cocherArticle(semaineId: string, cle: string, cochee: boolean, quand: Date): Promise<void> {
  await db()
    .insert(course)
    .values({ semaineId, cle, cochee, creeLe: quand })
    .onConflictDoUpdate({ target: [course.semaineId, course.cle], set: { cochee, modifieLe: quand } });
}

export async function ajouterArticleLibre(semaineId: string, nomId: string, quand: Date): Promise<void> {
  await db()
    .insert(course)
    .values({ semaineId, cle: `libre:${nomId}`, nomId, creeLe: quand })
    .onConflictDoNothing();
}

export async function retirerArticleLibre(semaineId: string, id: string): Promise<void> {
  await db().delete(course).where(and(eq(course.id, id), eq(course.semaineId, semaineId)));
}
