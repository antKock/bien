import type { ReactNode } from "react";
import { Chip } from "./Chip";
import { foyerCourant } from "@/lib/foyer-courant";

// En-tête d'écran (`.hd`) : titre 24 px disp, sous-titre 12.5 px muted, et à
// droite ce que l'écran y met (mot-repère, lien accent, bouton icône).
export function Entete({ titre, sousTitre, droite }: { titre: string; sousTitre?: string; droite?: ReactNode }) {
  return (
    <header className="flex items-center px-5 pb-3.5 pt-1.5">
      <div>
        <h1 className="font-disp text-[24px] font-medium leading-[1.15] tracking-[-0.2px]">{titre}</h1>
        {sousTitre && <div className="text-[12.5px] text-muted">{sousTitre}</div>}
      </div>
      <div className="ml-auto flex flex-none items-center gap-2 self-end">{droite}</div>
    </header>
  );
}

// En-tête des deux onglets : le mot-repère « Bien », précédé du marqueur du
// foyer de test pour ne jamais le confondre avec le foyer réel.
export async function EnteteOnglet({ titre, sousTitre }: { titre: string; sousTitre?: string }) {
  const foyer = await foyerCourant();
  return (
    <Entete
      titre={titre}
      sousTitre={sousTitre}
      droite={
        <>
          {foyer?.estTest && <Chip ton="test">foyer de test</Chip>}
          <span className="font-disp text-[16px] font-semibold tracking-[0.4px] text-accent">Bien</span>
        </>
      }
    />
  );
}
