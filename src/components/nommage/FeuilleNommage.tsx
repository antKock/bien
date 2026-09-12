"use client";

import { useState } from "react";
import { Bouton } from "@/components/ds/Bouton";
import { Feuille } from "@/components/ds/Feuille";
import { Section } from "@/components/ds/Section";
import { LONGUEUR_NOM_MAX, normaliserLibelle } from "@/domain/noms";

// La feuille de nommage : un champ, les noms déjà notés en pastilles, un CTA.
// Un seul gabarit pour « autre » (jokers), le plat libre et l'activité « autre ».
// Les noms déjà saisis sont toujours reproposés : c'est ce qui rend la donnée
// exploitable au lieu de produire du texte libre non normalisé.
export function FeuilleNommage({
  ouverte,
  titre,
  question,
  dejaNotes,
  cta,
  onValider,
  onFermer,
}: {
  ouverte: boolean;
  titre: string;
  question: string;
  dejaNotes: string[];
  cta: string;
  onValider: (nom: string) => void;
  onFermer: () => void;
}) {
  const [saisie, setSaisie] = useState("");
  const nom = normaliserLibelle(saisie);
  // Le champ est le premier élément focalisable de la feuille : `showModal()` le focalise.
  const fermer = () => {
    setSaisie("");
    onFermer();
  };

  return (
    <Feuille ouverte={ouverte} onFermer={fermer}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!nom) return;
          setSaisie("");
          onValider(nom);
        }}
      >
        <h2 className="font-disp text-[21px] font-medium tracking-[-0.2px]">{titre}</h2>
        <p className="mt-1 text-[13.5px] text-muted">{question}</p>
        <input
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          maxLength={LONGUEUR_NOM_MAX}
          autoCapitalize="sentences"
          enterKeyHint="done"
          className="mt-3.5 h-12 w-full rounded-btn border-[1.5px] border-soft2 bg-white px-3.5 text-[15px] shadow-focus outline-none"
        />
        {dejaNotes.length > 0 && (
          <>
            <Section className="mb-2 mt-4 text-muted">Déjà notés</Section>
            <div className="flex flex-wrap gap-1.5">
              {dejaNotes.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSaisie(n)}
                  className={`inline-flex h-[30px] items-center rounded-pill border px-3 text-[12px] ${
                    n === nom ? "border-soft2 bg-soft font-semibold text-accent-d" : "border-border bg-white text-muted"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </>
        )}
        <Bouton type="submit" variante={nom ? "primaire" : "inactif"} disabled={!nom} className="mt-5">
          {cta}
        </Bouton>
      </form>
    </Feuille>
  );
}
