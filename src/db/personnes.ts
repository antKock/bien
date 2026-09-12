import { asc, eq } from "drizzle-orm";
import { db } from "./index";
import { personne, type Personne } from "./schema";

export async function personnesDuFoyer(foyerId: string): Promise<Personne[]> {
  return db().select().from(personne).where(eq(personne.foyerId, foyerId)).orderBy(asc(personne.ordre));
}
