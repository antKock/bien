"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { foyerParCode } from "@/db/foyers";
import { codeComplet, normaliserCode } from "@/domain/code-foyer";
import { sessionCookie, signSession } from "@/lib/session";

export type EtatCode = { erreur?: string };

// Un code faux ne dit rien de plus que le fait : pas de rouge, pas de compteur.
// Le délai fixe après un échec rend la recherche exhaustive d'un code lente
// sans rien ajouter à l'interface.
const DELAI_ECHEC_MS = 600;

export async function entrerCode(_precedent: EtatCode, formData: FormData): Promise<EtatCode> {
  const code = normaliserCode(String(formData.get("code") ?? ""));
  if (!codeComplet(code)) return { erreur: "Le code fait six caractères." };

  const foyer = await foyerParCode(code);
  if (!foyer) {
    await new Promise((r) => setTimeout(r, DELAI_ECHEC_MS));
    return { erreur: "Ce code ne correspond à aucun foyer." };
  }

  (await cookies()).set(sessionCookie(await signSession(foyer.id)));
  redirect("/semaines");
}
