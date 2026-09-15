import { and, eq, inArray } from "drizzle-orm";
import { db } from "./index";
import {
  course,
  ecart,
  mesure,
  platSemaine,
  seance,
  semaine,
  type Course,
  type Ecart,
  type Mesure,
  type PlatSemaine,
  type Seance,
  type Semaine,
} from "./schema";
import type { SemaineInfo } from "@/domain/semaine";
import type { Jour } from "@/domain/jours";

// Une semaine avec tout ce qu'il faut pour sa carte et ses écrans de sujet.
export type SemaineChargee = Semaine & {
  mesures: Mesure[];
  seances: Seance[];
  ecarts: Ecart[];
  plats: PlatSemaine[];
  courses: Course[];
};

export function infoDe(s: Semaine): SemaineInfo {
  return {
    debut: s.debut,
    valideeLe: s.valideeLe,
    clotureeLe: s.clotureeLe,
    rouverteLe: s.rouverteLe,
    jokersValidesLe: s.jokersValidesLe,
  };
}

async function charger(rows: Semaine[]): Promise<SemaineChargee[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((s) => s.id);
  const [mesures, seances, ecarts, plats, courses] = await Promise.all([
    db().select().from(mesure).where(inArray(mesure.semaineId, ids)),
    db().select().from(seance).where(inArray(seance.semaineId, ids)),
    db().select().from(ecart).where(inArray(ecart.semaineId, ids)),
    db().select().from(platSemaine).where(inArray(platSemaine.semaineId, ids)),
    db().select().from(course).where(inArray(course.semaineId, ids)),
  ]);
  return rows.map((s) => ({
    ...s,
    mesures: mesures.filter((m) => m.semaineId === s.id),
    seances: seances.filter((x) => x.semaineId === s.id),
    ecarts: ecarts.filter((x) => x.semaineId === s.id),
    plats: plats.filter((x) => x.semaineId === s.id),
    courses: courses.filter((x) => x.semaineId === s.id),
  }));
}

export async function semainesDuFoyer(foyerId: string): Promise<SemaineChargee[]> {
  return charger(await db().select().from(semaine).where(eq(semaine.foyerId, foyerId)));
}

export async function semaineParDebut(foyerId: string, debut: Jour): Promise<SemaineChargee | null> {
  const rows = await db()
    .select()
    .from(semaine)
    .where(and(eq(semaine.foyerId, foyerId), eq(semaine.debut, debut)))
    .limit(1);
  return (await charger(rows))[0] ?? null;
}

/** La ligne de la semaine, créée à la première écriture. */
export async function obtenirSemaine(foyerId: string, debut: Jour): Promise<Semaine> {
  await db().insert(semaine).values({ foyerId, debut }).onConflictDoNothing();
  const rows = await db()
    .select()
    .from(semaine)
    .where(and(eq(semaine.foyerId, foyerId), eq(semaine.debut, debut)))
    .limit(1);
  return rows[0];
}

export async function majSemaine(id: string, patch: Partial<SemaineInfo>): Promise<void> {
  await db().update(semaine).set(patch).where(eq(semaine.id, id));
}
