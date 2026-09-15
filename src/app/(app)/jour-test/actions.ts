"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { foyerCourant } from "@/lib/foyer-courant";
import { COOKIE_JOUR_TEST } from "@/lib/horloge";

/** Foyer de test seulement : fixe le jour simulé, ou revient au jour réel. */
export async function fixerJourTest(jour: string | null): Promise<void> {
  const foyer = await foyerCourant();
  if (!foyer?.estTest) throw new Error("Réservé au foyer de test");
  const jar = await cookies();
  if (jour && /^\d{4}-\d{2}-\d{2}$/.test(jour)) {
    jar.set({ name: COOKIE_JOUR_TEST, value: jour, path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  } else {
    jar.delete(COOKIE_JOUR_TEST);
  }
  refresh();
}
