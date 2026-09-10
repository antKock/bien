import { cookies } from "next/headers";
import { cache } from "react";
import { foyerParId } from "@/db/foyers";
import { COOKIE_NAME, verifySession } from "@/lib/session";
import type { Foyer } from "@/db/schema";

// Le foyer de la session courante, résolu en base une fois par requête.
// `null` si le cookie est absent, invalide, ou pointe un foyer supprimé.
export const foyerCourant = cache(async (): Promise<Foyer | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;
  return foyerParId(session.fid);
});
