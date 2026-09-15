import { eq, inArray, isNull, not, sql } from "drizzle-orm";
import { db } from "@/db/index";
import { ingredient, recette } from "@/db/schema";
import { dureeDe, lireIngredients, portionsDe, scalabiliteDe, type RecetteMijote } from "@/domain/mijote";

// Le répertoire, c'est le carnet Mijote. À l'ouverture de « Ajouter un plat »,
// Bien relit le carnet (au plus toutes les dix minutes) et met sa table à jour
// par identifiant Mijote. Mijote injoignable : on garde la dernière version.

const INTERVALLE_MS = 10 * 60 * 1000;
const g = globalThis as unknown as { __bienMijoteSync?: number };

type Reponse = { carnet: { id: string; nom: string }; recettes: RecetteMijote[] };

export function carnetConfigure(): boolean {
  return Boolean(process.env.MIJOTE_URL && process.env.MIJOTE_CARNET && process.env.MIJOTE_SECRET);
}

async function lireCarnet(): Promise<Reponse | null> {
  const url = `${process.env.MIJOTE_URL!.replace(/\/$/, "")}/api/carnets/${process.env.MIJOTE_CARNET}/recettes`;
  try {
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${process.env.MIJOTE_SECRET}`, "x-mijote-probe": "1" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`Mijote : ${res.status} sur ${url}`);
      return null;
    }
    return (await res.json()) as Reponse;
  } catch (e) {
    console.warn("Mijote injoignable :", e instanceof Error ? e.message : e);
    return null;
  }
}

/** Relit le carnet si le dernier passage date, et rend le nombre de recettes synchronisées (null si rien fait). */
export async function synchroniserCarnet(force = false): Promise<number | null> {
  if (!carnetConfigure()) return null;
  const maintenant = Date.now();
  if (!force && g.__bienMijoteSync && maintenant - g.__bienMijoteSync < INTERVALLE_MS) return null;
  const reponse = await lireCarnet();
  if (!reponse) return null;
  g.__bienMijoteSync = maintenant;

  const ids: string[] = [];
  for (const r of reponse.recettes) {
    ids.push(r.id);
    const [row] = await db()
      .insert(recette)
      .values({
        mijoteId: r.id,
        nom: r.titre,
        duree: dureeDe(r.preparation, r.cuisson),
        portionsParLot: portionsDe(r.parts),
        scalabilite: scalabiliteDe(r.titre),
        imageUrl: r.image,
        lienUrl: r.lien,
        dansCarnet: true,
        mijoteMajLe: new Date(),
      })
      .onConflictDoUpdate({
        target: recette.mijoteId,
        set: {
          nom: r.titre,
          duree: dureeDe(r.preparation, r.cuisson),
          portionsParLot: portionsDe(r.parts),
          scalabilite: scalabiliteDe(r.titre),
          imageUrl: r.image,
          lienUrl: r.lien,
          dansCarnet: true,
          mijoteMajLe: new Date(),
        },
      })
      .returning({ id: recette.id });
    await db().delete(ingredient).where(eq(ingredient.recetteId, row.id));
    const lignes = lireIngredients(r.ingredients);
    if (lignes.length > 0) {
      await db()
        .insert(ingredient)
        .values(lignes.map((l, i) => ({ recetteId: row.id, ...l, ordre: i })));
    }
  }
  // Ce qui n'est plus dans le carnet, et ce qui n'en vient pas, sort de l'ajout.
  await db()
    .update(recette)
    .set({ dansCarnet: false })
    .where(ids.length > 0 ? not(inArray(recette.mijoteId, ids)) : sql`true`);
  await db().update(recette).set({ dansCarnet: false }).where(isNull(recette.mijoteId));
  return ids.length;
}
