import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { mesure } from "./schema";
import type { TypeMesure } from "@/domain/mesures";

/** Une valeur tapée est enregistrée ; vide, elle efface. La correction écrase et se date. */
export async function enregistrerMesure(
  semaineId: string,
  personneId: string,
  type: TypeMesure,
  valeur: number | null,
  quand: Date,
): Promise<void> {
  const ou = and(eq(mesure.semaineId, semaineId), eq(mesure.personneId, personneId), eq(mesure.type, type));
  if (valeur === null) {
    await db().delete(mesure).where(ou);
    return;
  }
  await db()
    .insert(mesure)
    .values({ semaineId, personneId, type, valeur, creeLe: quand })
    .onConflictDoUpdate({
      target: [mesure.semaineId, mesure.personneId, mesure.type],
      set: { valeur, modifieLe: quand },
    });
}
