"use client";

import { startTransition, useOptimistic, useState } from "react";
import { basculerEcart } from "@/app/(pile)/semaines/[debut]/jokers/actions";
import { Carte } from "@/components/ds/Carte";
import { FeuilleNommage } from "@/components/nommage/FeuilleNommage";
import { bilanCases, coutSoiree, jauge, type CaseGrille, type TypeEcart } from "@/domain/jokers";
import { JOURS_ABREGES, nomDuJour } from "@/lib/dates";
import { Jauge } from "./Jauge";

// La grille des sept soirs : 7 lignes × 5 colonnes + le coût. Une passe du
// pouce ; chaque coche est enregistrée à l'instant et affichée avant la
// réponse du serveur. Même composant pour poser et pour confirmer.
const COLONNES: { type: TypeEcart; libelle: string }[] = [
  { type: "apero_riche", libelle: "apéro" },
  { type: "alcool", libelle: "alcool" },
  { type: "repas_riche", libelle: "repas" },
  { type: "extra_sucre", libelle: "sucré" },
  { type: "autre", libelle: "autre" },
];

const COCHE = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

const cle = (jour: number, type: TypeEcart) => `${jour}:${type}`;

export function GrilleJokers({
  debut,
  cases,
  nomsAutre,
  modifiable,
  jourCourant,
  jourEnEvidence,
  nouveauxPrevus,
}: {
  debut: string;
  cases: CaseGrille[];
  nomsAutre: string[];
  modifiable: boolean;
  /** Dernier jour passé (0-7) : décide de consommé / à venir. */
  jourCourant: number;
  /** Le jour d'aujourd'hui quand la semaine est en cours, sinon null. */
  jourEnEvidence: number | null;
  /** Avant validation, toute nouvelle case est prévue. */
  nouveauxPrevus: boolean;
}) {
  const [grille, appliquer] = useOptimistic(
    new Map(cases.map((c) => [cle(c.jour, c.type), c])),
    (etat, c: CaseGrille) => new Map(etat).set(cle(c.jour, c.type), c),
  );
  const [feuille, setFeuille] = useState<number | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const caseDe = (jour: number, type: TypeEcart) => grille.get(cle(jour, type));
  const presente = (jour: number, type: TypeEcart) => caseDe(jour, type)?.present ?? false;

  function basculer(jour: number, type: TypeEcart, nom: string | null = null) {
    if (!modifiable) return;
    const actuelle = caseDe(jour, type);
    if (!actuelle?.present && type === "autre" && nom === null) {
      setFeuille(jour);
      return;
    }
    const suivante: CaseGrille = actuelle
      ? { ...actuelle, present: !actuelle.present }
      : { jour, type, present: true, prevu: nouveauxPrevus };
    startTransition(async () => {
      appliquer(suivante);
      try {
        await basculerEcart(debut, jour, type, nom);
        setErreur(null);
      } catch {
        setErreur("La coche n'a pas été enregistrée.");
      }
    });
  }

  const toutes = [...grille.values()];
  const bilan = bilanCases(toutes, jourCourant);

  return (
    <>
      <Jauge jetons={jauge(bilan.consomme, bilan.aVenir)} />
      <Carte className="px-[15px] pb-[11px] pt-[13px]">
        <div className="mb-0.5 flex items-center gap-[5px] border-b border-[rgba(226,222,213,.9)] pb-1.5" aria-hidden>
          <span className="w-[30px] flex-none" />
          {COLONNES.map((c) => (
            <span
              key={c.type}
              className={`flex h-[26px] min-w-0 flex-1 items-end justify-center font-mono text-[8.5px] ${
                c.type === "autre" ? "text-[#C4C1B9]" : "text-nav-off"
              }`}
            >
              {c.libelle}
            </span>
          ))}
          <span className="w-[22px] flex-none" />
        </div>
        {JOURS_ABREGES.map((libelle, i) => {
          const jour = i + 1;
          const nb = COLONNES.filter((c) => presente(jour, c.type)).length;
          const cout = coutSoiree(nb);
          return (
            <div key={jour} className="flex items-center gap-[5px] py-1" role="group" aria-label={nomDuJour(jour)}>
              <span
                className={`w-[30px] flex-none font-mono text-[10.5px] tracking-[0.03em] ${
                  jour === jourEnEvidence ? "font-semibold text-accent-d" : "text-muted"
                }`}
              >
                {libelle}
              </span>
              {COLONNES.map((c) => {
                const on = presente(jour, c.type);
                const autre = c.type === "autre";
                return (
                  <button
                    key={c.type}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    aria-label={`${c.libelle}, ${nomDuJour(jour)}`}
                    disabled={!modifiable}
                    onClick={() => basculer(jour, c.type)}
                    className={`flex h-[38px] min-w-0 flex-1 items-center justify-center rounded-[10px] border-[1.5px] touch-manipulation ${
                      on
                        ? "border-soft2 bg-soft text-accent-d"
                        : autre
                          ? "border-dashed border-border bg-[rgba(255,255,255,.45)] text-transparent"
                          : "border-[#DFDBD2] bg-white text-transparent"
                    }`}
                  >
                    {on && COCHE}
                  </button>
                );
              })}
              <span className={`w-[22px] flex-none text-right font-mono text-[12px] ${cout > 0 ? "text-pose-text" : "text-box"}`}>
                {cout === 0 ? "·" : cout === 0.5 ? "½" : "1"}
              </span>
            </div>
          );
        })}
      </Carte>
      {erreur && <p className="mt-2 text-[11.5px] text-muted">{erreur}</p>}
      <FeuilleNommage
        ouverte={feuille !== null}
        titre={feuille === null ? "" : `Autre, ${nomDuJour(feuille)}`}
        question={feuille !== null && feuille <= jourCourant ? "C'était quoi ?" : "Ce sera quoi ?"}
        dejaNotes={nomsAutre}
        cta="Enregistrer"
        onValider={(nom) => {
          const jour = feuille;
          setFeuille(null);
          if (jour !== null) basculer(jour, "autre", nom);
        }}
        onFermer={() => setFeuille(null)}
      />
    </>
  );
}
