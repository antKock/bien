import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { platSemaine } from "./schema";

export async function ajouterPlatRecette(semaineId: string, recetteId: string, repasCuisines: number, quand: Date): Promise<void> {
  await db()
    .insert(platSemaine)
    .values({ semaineId, recetteId, repas: 1, repasCuisines, creeLe: quand })
    .onConflictDoNothing();
}

export async function ajouterPlatLibre(semaineId: string, nomId: string, repasCuisines: number, quand: Date): Promise<void> {
  await db().insert(platSemaine).values({ semaineId, nomId, repas: 1, repasCuisines, creeLe: quand }).onConflictDoNothing();
}

export async function retirerPlat(semaineId: string, id: string): Promise<void> {
  await db().delete(platSemaine).where(and(eq(platSemaine.id, id), eq(platSemaine.semaineId, semaineId)));
}

export async function majPlat(
  semaineId: string,
  id: string,
  patch: { repas?: number; repasCuisines?: number },
  quand: Date,
): Promise<void> {
  await db()
    .update(platSemaine)
    .set({ ...patch, modifieLe: quand })
    .where(and(eq(platSemaine.id, id), eq(platSemaine.semaineId, semaineId)));
}

export async function toutCocherPlats(semaineId: string, quand: Date): Promise<void> {
  await db()
    .update(platSemaine)
    .set({ repasCuisines: platSemaine.repas, modifieLe: quand })
    .where(eq(platSemaine.semaineId, semaineId));
}
