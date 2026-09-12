import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Ecran } from "@/components/ds/Ecran";
import { foyerCourant } from "@/lib/foyer-courant";

// Les écrans empilés : pas de barre de navigation, le chevron retour est la
// seule sortie. Même vérification de foyer que les onglets.
export default async function LayoutPile({ children }: { children: ReactNode }) {
  const foyer = await foyerCourant();
  if (!foyer) redirect("/foyer");
  return <Ecran>{children}</Ecran>;
}
