import Link from "next/link";
import type { ReactNode } from "react";
import { Entete } from "./Entete";

// En-tête d'un écran empilé : le chevron retour est la seule sortie. À droite,
// au plus un lien accent (« Tout cocher ») ou le bouton panier.
export function EnteteEmpile({
  titre,
  sousTitre,
  retour,
  droite,
}: {
  titre: string;
  sousTitre?: string;
  retour: string;
  droite?: ReactNode;
}) {
  return (
    <Entete
      titre={titre}
      sousTitre={sousTitre}
      droite={droite}
      gauche={
        <Link
          href={retour}
          aria-label="Retour"
          className="-ml-[9px] mr-[3px] flex h-8 w-8 flex-none items-center justify-center pb-[3px] text-[26px] leading-none text-accent-d"
        >
          ‹
        </Link>
      }
    />
  );
}

/** Lien accent d'en-tête (`.hact`) : 13 px, accent, 500. Soumet le formulaire qui l'entoure. */
export function LienAccent({ children }: { children: ReactNode }) {
  return (
    <button type="submit" className="text-[13px] font-medium text-accent">
      {children}
    </button>
  );
}
