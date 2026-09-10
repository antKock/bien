import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Ecran } from "@/components/ds/Ecran";
import { NavOnglets } from "@/components/ds/NavOnglets";
import { foyerCourant } from "@/lib/foyer-courant";

// Les écrans de premier niveau : deux onglets, un foyer résolu en base. Le
// proxy a déjà vérifié le cookie ; ici on vérifie que le foyer existe encore.
export default async function LayoutApp({ children }: { children: ReactNode }) {
  const foyer = await foyerCourant();
  if (!foyer) redirect("/foyer");
  return (
    <Ecran avecNav>
      {children}
      <NavOnglets />
    </Ecran>
  );
}
