import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { seance } from "./schema";
import type { SeanceInfo } from "@/domain/activite";

export async function ajouterSeances(semaineId: string, seances: SeanceInfo[]): Promise<void> {
  await db()
    .insert(seance)
    .values(seances.map((s) => ({ semaineId, ...s })));
}

export async function retirerSeance(semaineId: string, id: string): Promise<void> {
  await db().delete(seance).where(and(eq(seance.id, id), eq(seance.semaineId, semaineId)));
}

export async function cocherSeance(semaineId: string, id: string, faite: boolean): Promise<void> {
  await db()
    .update(seance)
    .set({ faite, modifieLe: new Date() })
    .where(and(eq(seance.id, id), eq(seance.semaineId, semaineId)));
}

export async function toutCocherSeances(semaineId: string): Promise<void> {
  await db()
    .update(seance)
    .set({ faite: true, modifieLe: new Date() })
    .where(and(eq(seance.semaineId, semaineId), eq(seance.faite, false)));
}
