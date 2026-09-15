import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { ecart, type Ecart } from "./schema";
import type { TypeEcart } from "@/domain/jokers";

const cle = (semaineId: string, jour: number, type: TypeEcart) =>
  and(eq(ecart.semaineId, semaineId), eq(ecart.jour, jour), eq(ecart.type, type));

export async function ecartExistant(semaineId: string, jour: number, type: TypeEcart): Promise<Ecart | null> {
  const rows = await db().select().from(ecart).where(cle(semaineId, jour, type)).limit(1);
  return rows[0] ?? null;
}

export async function creerEcart(
  semaineId: string,
  jour: number,
  type: TypeEcart,
  nomId: string | null,
  quand: Date,
): Promise<void> {
  await db().insert(ecart).values({ semaineId, jour, type, nomId, creeLe: quand });
}

export async function supprimerEcart(id: string): Promise<void> {
  await db().delete(ecart).where(eq(ecart.id, id));
}

export async function retirerEcart(id: string, quand: Date): Promise<void> {
  await db().update(ecart).set({ retireLe: quand, modifieLe: quand }).where(eq(ecart.id, id));
}

/** Recocher un écart retiré : le retrait s'annule, le nom peut changer. */
export async function reprendreEcart(id: string, nomId: string | null, quand: Date): Promise<void> {
  await db().update(ecart).set({ retireLe: null, modifieLe: quand, nomId }).where(eq(ecart.id, id));
}
