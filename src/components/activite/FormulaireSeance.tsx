"use client";

import { useState, useTransition } from "react";
import { ajouterSeance } from "@/app/(pile)/semaines/[debut]/activite/actions";
import { Bouton } from "@/components/ds/Bouton";
import { Carte } from "@/components/ds/Carte";
import { Pastilles } from "@/components/ds/Pastilles";
import { Section } from "@/components/ds/Section";
import { FeuilleNommage } from "@/components/nommage/FeuilleNommage";
import { ACTIVITES, CRENEAUX, type Activite, type Creneau } from "@/domain/activite";
import { JOURS_ABREGES } from "@/lib/dates";

// Écran 10 : quatre questions courtes en pastilles. « Les deux » crée deux
// séances ; « Autre » demande un nom par la feuille de nommage. Le CTA reste
// inactif tant qu'une réponse manque.
const LIBELLES_ACTIVITE: Record<Activite, string> = { course: "Course", pilates: "Pilates", renfo: "Renfo", velo: "Vélo", autre: "Autre" };
const LIBELLES_CRENEAU: Record<Creneau, string> = { matin: "matin", midi: "midi", soir: "19 h" };
const LES_DEUX = "les_deux";

export function FormulaireSeance({
  debut,
  personnes,
  nomsActivite,
}: {
  debut: string;
  personnes: { id: string; prenom: string }[];
  nomsActivite: string[];
}) {
  const [qui, setQui] = useState<string | null>(null);
  const [activite, setActivite] = useState<Activite | null>(null);
  const [nom, setNom] = useState<string | null>(null);
  const [jour, setJour] = useState<string | null>(null);
  const [creneau, setCreneau] = useState<Creneau | null>(null);
  const [feuille, setFeuille] = useState(false);
  const [enCours, lancer] = useTransition();

  const complet = qui !== null && activite !== null && (activite !== "autre" || nom !== null) && jour !== null && creneau !== null;

  function ajouter() {
    if (!complet) return;
    lancer(() =>
      ajouterSeance(debut, {
        qui: qui === LES_DEUX ? personnes.map((p) => p.id) : [qui],
        activite,
        nom,
        jour: Number(jour),
        creneau,
      }),
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col px-5">
        <Carte className="px-[17px] py-4">
          <Section className="mb-2 text-muted">Qui</Section>
          <Pastilles
            options={[...personnes.map((p) => ({ valeur: p.id, libelle: p.prenom })), { valeur: LES_DEUX, libelle: "Les deux" }]}
            choix={qui}
            onChoix={setQui}
          />
          <Section className="mb-2 mt-4 text-muted">Quoi</Section>
          <Pastilles
            options={ACTIVITES.map((a) => ({ valeur: a, libelle: a === "autre" && nom ? nom : LIBELLES_ACTIVITE[a] }))}
            choix={activite}
            onChoix={(a) => {
              setActivite(a);
              if (a === "autre") setFeuille(true);
            }}
          />
          <Section className="mb-2 mt-4 text-muted">Quel jour</Section>
          <Pastilles options={JOURS_ABREGES.map((j, i) => ({ valeur: String(i + 1), libelle: j }))} choix={jour} onChoix={setJour} />
          <Section className="mb-2 mt-4 text-muted">Quel créneau</Section>
          <Pastilles options={CRENEAUX.map((c) => ({ valeur: c, libelle: LIBELLES_CRENEAU[c] }))} choix={creneau} onChoix={setCreneau} />
        </Carte>
      </div>
      <div className="flex-none px-5 pb-[18px] pt-3">
        <Bouton variante={complet ? "primaire" : "inactif"} disabled={!complet || enCours} onClick={ajouter}>
          Ajouter à la semaine
        </Bouton>
      </div>
      <FeuilleNommage
        ouverte={feuille}
        titre="Autre activité"
        question="Comment tu l'appelles ?"
        dejaNotes={nomsActivite}
        cta="Enregistrer"
        onValider={(n) => {
          setNom(n);
          setFeuille(false);
        }}
        onFermer={() => {
          setFeuille(false);
          if (nom === null) setActivite(null);
        }}
      />
    </>
  );
}
