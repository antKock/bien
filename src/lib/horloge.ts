import { cookies } from "next/headers";
import { cache } from "react";
import { debutDuJour, jourDe, type Jour } from "@/domain/jours";
import { foyerCourant } from "@/lib/foyer-courant";

// L'horloge de la requête. Le jour peut être simulé : par `BIEN_AUJOURDHUI`
// en développement, ou par un cookie que seul le foyer de test peut poser
// (pour rejouer un dimanche, remplir des semaines, regarder Tendances).
// Le décalage s'applique aussi aux horodatages écrits, sinon tout ce qu'on
// rejoue devient « non prévu ».

export const COOKIE_JOUR_TEST = "bien_jour_test";
const FORMAT_JOUR = /^\d{4}-\d{2}-\d{2}$/;

export type Horloge = { jour: Jour; maintenant: Date; simule: boolean };

export const horloge = cache(async (): Promise<Horloge> => {
  const reel = new Date();
  const foyer = await foyerCourant();
  const cookie = foyer?.estTest ? (await cookies()).get(COOKIE_JOUR_TEST)?.value : undefined;
  const fixe = [cookie, process.env.BIEN_AUJOURDHUI].find((v) => v && FORMAT_JOUR.test(v));
  if (!fixe) return { jour: jourDe(reel), maintenant: reel, simule: false };
  const maintenant = new Date(reel.getTime() + debutDuJour(fixe).getTime() - debutDuJour(jourDe(reel)).getTime());
  return { jour: jourDe(maintenant), maintenant, simule: true };
});
