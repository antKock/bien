"use client";

import { startTransition, useOptimistic, useState } from "react";
import { ajouterArticle, cocherArticleLibre, cocherArticles, retirerArticle } from "@/app/(pile)/semaines/[debut]/courses/actions";
import { Bouton } from "@/components/ds/Bouton";
import { Case } from "@/components/ds/Case";
import { Onglets } from "@/components/ds/Onglets";
import { Section } from "@/components/ds/Section";
import { FeuilleNommage } from "@/components/nommage/FeuilleNommage";
import { cleArticle, formatProvenance, formatQuantite, type Article, type Rayon } from "@/domain/plats";

// Écran 08 : la liste de courses, par rayon ou par plat. La case dit « réglé » ;
// « Par plat » coche tout un plat d'un coup. Tout est calculé, seules les
// coches et les articles ajoutés à la main sont à nous.
const RAYONS: Record<Rayon, string> = {
  primeur: "Primeur",
  boucher: "Boucher",
  poissonnier: "Poissonnier",
  cremerie: "Crèmerie",
  epicerie: "Épicerie",
  surgeles: "Surgelés",
  epices_base: "Épices & base",
};

type Libre = { id: string; nom: string; cochee: boolean };

export function ListeCourses({
  debut,
  parRayon,
  parPlat,
  cochees,
  libres,
  nomsArticles,
  modifiable,
}: {
  debut: string;
  parRayon: { rayon: Rayon; articles: Article[] }[];
  parPlat: { plat: string; repas: number; articles: Article[] }[];
  cochees: string[];
  libres: Libre[];
  nomsArticles: string[];
  modifiable: boolean;
}) {
  const [vue, setVue] = useState<"rayon" | "plat">("rayon");
  const [feuille, setFeuille] = useState(false);
  const [etat, appliquer] = useOptimistic(
    { cochees: new Set(cochees), libres },
    (e, a: { cles?: string[]; cochee: boolean; libreId?: string }) => {
      const n = { cochees: new Set(e.cochees), libres: e.libres };
      for (const c of a.cles ?? []) if (a.cochee) n.cochees.add(c); else n.cochees.delete(c);
      if (a.libreId) n.libres = e.libres.map((l) => (l.id === a.libreId ? { ...l, cochee: a.cochee } : l));
      return n;
    },
  );

  function cocher(cles: string[], cochee: boolean) {
    if (!modifiable) return;
    startTransition(async () => {
      appliquer({ cles, cochee });
      await cocherArticles(debut, cles, cochee);
    });
  }
  function cocherLibre(l: Libre) {
    if (!modifiable) return;
    startTransition(async () => {
      appliquer({ libreId: l.id, cochee: !l.cochee });
      await cocherArticleLibre(debut, l.id, !l.cochee);
    });
  }

  const ligne = (a: Article) => {
    const cle = cleArticle(a);
    const on = etat.cochees.has(cle);
    return (
      <button
        key={cle}
        type="button"
        role="checkbox"
        aria-checked={on}
        disabled={!modifiable}
        onClick={() => cocher([cle], !on)}
        className={`flex w-full items-start gap-3 border-b border-[rgba(226,222,213,.7)] py-[11px] text-left text-[14px] last:border-b-0 ${
          on ? "text-faint line-through" : ""
        }`}
      >
        <Case cochee={on} />
        <span className="flex-1">
          {a.nom}
          <span className="mt-[3px] block font-mono text-[9px] leading-[1.35] tracking-[0.02em] text-faint no-underline">
            {formatProvenance(a.provenances)}
          </span>
        </span>
        <span className="ml-auto mt-px flex-none text-right font-mono text-[12px] text-faint">{formatQuantite(a.quantite, a.unite)}</span>
      </button>
    );
  };

  return (
    <>
      <div className="px-5">
        <Onglets
          options={[
            { valeur: "rayon", libelle: "Par rayon" },
            { valeur: "plat", libelle: "Par plat" },
          ]}
          actif={vue}
          onChoix={setVue}
        />
      </div>
      <div className="flex flex-1 flex-col gap-3.5 px-5 pb-[46px] pt-3">
        {vue === "rayon"
          ? parRayon.map((r) => (
              <div key={r.rayon}>
                <Section>{RAYONS[r.rayon]}</Section>
                {r.articles.map(ligne)}
              </div>
            ))
          : parPlat.map((p) => {
              const cles = p.articles.map(cleArticle);
              const tout = cles.length > 0 && cles.every((c) => etat.cochees.has(c));
              return (
                <div key={p.plat}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={tout}
                    disabled={!modifiable}
                    onClick={() => cocher(cles, !tout)}
                    className="flex w-full items-center gap-3 py-1 text-left"
                  >
                    <Case cochee={tout} />
                    <Section className="text-muted">
                      {p.plat} ×{p.repas}
                    </Section>
                  </button>
                  {p.articles.map(ligne)}
                </div>
              );
            })}
        {etat.libres.length > 0 && (
          <div>
            <Section>Ajoutés à la main</Section>
            {etat.libres.map((l) => (
              <div key={l.id} className="flex items-start gap-3 border-b border-[rgba(226,222,213,.7)] py-[11px] text-[14px] last:border-b-0">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={l.cochee}
                  disabled={!modifiable}
                  onClick={() => cocherLibre(l)}
                  className={`flex flex-1 items-start gap-3 text-left ${l.cochee ? "text-faint line-through" : ""}`}
                >
                  <Case cochee={l.cochee} />
                  <span className="flex-1">{l.nom}</span>
                </button>
                {modifiable && (
                  <button
                    type="button"
                    aria-label="Retirer"
                    onClick={() => startTransition(() => retirerArticle(debut, l.id))}
                    className="-my-1 flex h-7 w-7 flex-none items-center justify-center text-[20px] leading-none text-[#CFCAC0]"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {modifiable && (
          <Bouton variante="secondaire" onClick={() => setFeuille(true)}>
            + Ajouter un article
          </Bouton>
        )}
      </div>
      <FeuilleNommage
        ouverte={feuille}
        titre="Un article"
        question="Quoi d'autre ?"
        dejaNotes={nomsArticles}
        cta="Ajouter à la liste"
        onValider={(nom) => {
          setFeuille(false);
          startTransition(() => ajouterArticle(debut, nom));
        }}
        onFermer={() => setFeuille(false)}
      />
    </>
  );
}
