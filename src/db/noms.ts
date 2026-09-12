import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "./index";
import { nomConserve, type NomConserve } from "./schema";
import { normaliserLibelle, type UsageNom } from "@/domain/noms";

/** Les noms déjà notés pour un usage, les plus récents d'abord. */
export async function nomsConserves(foyerId: string, usage: UsageNom): Promise<NomConserve[]> {
  return db()
    .select()
    .from(nomConserve)
    .where(and(eq(nomConserve.foyerId, foyerId), eq(nomConserve.usage, usage)))
    .orderBy(desc(nomConserve.creeLe));
}

/** Retrouve un nom sans tenir compte de la casse, ou le crée. */
export async function obtenirNom(foyerId: string, usage: UsageNom, saisie: string): Promise<NomConserve> {
  const libelle = normaliserLibelle(saisie);
  const existants = await db()
    .select()
    .from(nomConserve)
    .where(
      and(
        eq(nomConserve.foyerId, foyerId),
        eq(nomConserve.usage, usage),
        sql`lower(${nomConserve.libelle}) = lower(${libelle})`,
      ),
    )
    .limit(1);
  if (existants[0]) return existants[0];
  const [cree] = await db().insert(nomConserve).values({ foyerId, usage, libelle }).returning();
  return cree;
}

export async function nomsParId(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const rows = await db().select().from(nomConserve).where(inArray(nomConserve.id, ids));
  return new Map(rows.map((r) => [r.id, r.libelle]));
}
