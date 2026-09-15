import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Ecran, Pad } from "@/components/ds/Ecran";
import { JourTest } from "@/components/ds/JourTest";
import { NavOnglets } from "@/components/ds/NavOnglets";
import { foyerCourant } from "@/lib/foyer-courant";
import { horloge } from "@/lib/horloge";

// Les écrans de premier niveau : deux onglets, un foyer résolu en base. Le
// proxy a déjà vérifié le cookie ; ici on vérifie que le foyer existe encore.
export default async function LayoutApp({ children }: { children: ReactNode }) {
  const foyer = await foyerCourant();
  if (!foyer) redirect("/foyer");
  const h = await horloge();
  return (
    <Ecran avecNav>
      {children}
      {foyer.estTest && (
        <Pad className="pb-4">
          <JourTest jour={h.jour} simule={h.simule} />
        </Pad>
      )}
      <NavOnglets />
    </Ecran>
  );
}
