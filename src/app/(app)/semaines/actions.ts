"use server";

import { refresh } from "next/cache";
import { infoDe, majSemaine, obtenirSemaine } from "@/db/semaines";
import { cloturer, rouvrir, valider } from "@/domain/semaine";
import { aujourdhui } from "@/lib/dates";
import { foyerCourant } from "@/lib/foyer-courant";
import { debutValide } from "@/lib/semaines";

// Les trois gestes de la carte. Chacun crée la ligne de semaine si elle
// n'existe pas encore, applique la transition du domaine, puis rafraîchit.

async function semaineDuFoyer(debut: string) {
  const foyer = await foyerCourant();
  if (!foyer) throw new Error("Aucun foyer");
  return obtenirSemaine(foyer.id, debutValide(debut));
}

export async function validerSemaine(debut: string): Promise<void> {
  const s = await semaineDuFoyer(debut);
  await majSemaine(s.id, valider(infoDe(s), new Date(), aujourdhui()));
  refresh();
}

export async function cloturerSemaine(debut: string): Promise<void> {
  const s = await semaineDuFoyer(debut);
  await majSemaine(s.id, cloturer(infoDe(s), new Date(), aujourdhui()));
  refresh();
}

export async function rouvrirSemaine(debut: string): Promise<void> {
  const s = await semaineDuFoyer(debut);
  await majSemaine(s.id, rouvrir(infoDe(s), new Date()));
  refresh();
}
