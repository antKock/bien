"use client";

import { useState, useTransition } from "react";
import { ajouterPlats } from "@/app/(pile)/semaines/[debut]/plats/actions";
import { Bouton } from "@/components/ds/Bouton";
import { Case } from "@/components/ds/Case";
import { Onglets } from "@/components/ds/Onglets";
import { Placeholder } from "@/components/ds/Placeholder";
import { FeuilleNommage } from "@/components/nommage/FeuilleNommage";

// Écrans 06 et 07 : la grille du répertoire, filtrée par durée, une case par
// tuile (règle ③ : sélectionner, c'est cocher). La tuile « Plat libre » ouvre
// la feuille de nommage, dont le CTA ajoute tout et revient aux plats.
export type Tuile = { id: string; nom: string; duree: "express" | "rapide" | "long"; nbArticles: number };
type Filtre = "tous" | Tuile["duree"];

const FILTRES: { valeur: Filtre; libelle: string }[] = [
  { valeur: "tous", libelle: "Tous" },
  { valeur: "express", libelle: "Express" },
  { valeur: "rapide", libelle: "Rapide" },
  { valeur: "long", libelle: "Long" },
];

export function ChoixPlats({ debut, tuiles, nomsLibres }: { debut: string; tuiles: Tuile[]; nomsLibres: string[] }) {
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [choisies, setChoisies] = useState<Set<string>>(new Set());
  const [feuille, setFeuille] = useState(false);
  const [enCours, lancer] = useTransition();
  const visibles = tuiles.filter((t) => filtre === "tous" || t.duree === filtre);

  function ajouter(platLibre: string | null) {
    lancer(() => ajouterPlats(debut, [...choisies], platLibre));
  }
  const basculer = (id: string) =>
    setChoisies((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <>
      <div className="px-5">
        <Onglets options={FILTRES} actif={filtre} onChoix={setFiltre} />
      </div>
      <div className="flex-1 px-5 pt-3.5">
        <div className="grid grid-cols-2 gap-[11px]">
          {visibles.map((t) => {
            const on = choisies.has(t.id);
            return (
              <button
                key={t.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => basculer(t.id)}
                className={`overflow-hidden rounded-card border bg-white text-left shadow-card ${on ? "border-soft2" : "border-border"}`}
              >
                <Placeholder libelle="illustration Mijote" className="h-[84px]" />
                <div className="px-[11px] py-2.5">
                  <b className="block text-[13px] font-semibold leading-[1.25]">{t.nom}</b>
                  <div className="mt-2 flex items-center">
                    <span className="font-mono text-[10px] text-faint">
                      {t.duree} · +{t.nbArticles}
                    </span>
                    <span className="ml-auto">
                      <Case cochee={on} />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setFeuille(true)}
            className="flex min-h-[132px] flex-col items-center justify-center gap-[5px] rounded-card border border-dashed border-border bg-[rgba(255,255,255,.5)]"
          >
            <span className="text-[20px] text-[#CFCAC0]">+</span>
            <span className="text-[11.5px] text-muted">Plat libre</span>
            <span className="border-b border-dashed border-soft2 pb-px font-mono text-[8.5px] text-accent">écrire un nom</span>
          </button>
        </div>
      </div>
      <div className="flex-none px-5 pb-[18px] pt-3">
        <Bouton variante={choisies.size > 0 ? "primaire" : "inactif"} disabled={choisies.size === 0 || enCours} onClick={() => ajouter(null)}>
          Ajouter à la semaine
        </Bouton>
      </div>
      <FeuilleNommage
        ouverte={feuille}
        titre="Plat libre"
        question="Comment tu l'appelles ?"
        dejaNotes={nomsLibres}
        cta="Ajouter à la semaine"
        onValider={(nom) => {
          setFeuille(false);
          ajouter(nom);
        }}
        onFermer={() => setFeuille(false)}
      />
    </>
  );
}
