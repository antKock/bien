import { eq } from "drizzle-orm";
import { db } from "./index";
import { foyer, type Foyer } from "./schema";

export async function foyerParCode(code: string): Promise<Foyer | null> {
  const rows = await db().select().from(foyer).where(eq(foyer.code, code)).limit(1);
  return rows[0] ?? null;
}

export async function foyerParId(id: string): Promise<Foyer | null> {
  const rows = await db().select().from(foyer).where(eq(foyer.id, id)).limit(1);
  return rows[0] ?? null;
}

