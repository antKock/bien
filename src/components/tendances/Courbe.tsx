"use client";

import { useState } from "react";
import { Avatar } from "@/components/ds/Avatar";
import { Carte } from "@/components/ds/Carte";
import { Onglets } from "@/components/ds/Onglets";
import { Section } from "@/components/ds/Section";
import type { PointTendance, TypeMesure } from "@/domain/mesures";
import { formatPct, tracer } from "@/domain/tendances";

// La courbe : SVG à la main, en % du départ, les deux personnes sur le même
// graphe. Les onglets basculent poids / tour de taille. Rien n'est rendu
// pour une personne sous trois mesures ; rien du tout si aucune n'y est.
const COULEURS = ["#46707A", "#B0673B"];
const LARGEUR = 300;
const HAUTEUR = 110;

export type SeriePersonne = { prenom: string; initiales: string; ordre: number; points: PointTendance[] };

export function Courbe({ series }: { series: Record<TypeMesure, SeriePersonne[]> }) {
  const [type, setType] = useState<TypeMesure>("poids");
  const visibles = series[type].filter((s) => s.points.length > 0);
  const { traces, echelle } = tracer(visibles, LARGEUR, HAUTEUR);
  const libelle = type === "poids" ? "Poids" : "Taille";
  const y = (pct: number) => 8 + ((echelle.haut - pct) / (echelle.haut - echelle.bas)) * (HAUTEUR - 16);
  const milieu = (echelle.haut + echelle.bas) / 2;

  return (
    <>
      <Onglets
        options={[
          { valeur: "poids", libelle: "Poids" },
          { valeur: "tour_taille", libelle: "Tour de taille" },
        ]}
        actif={type}
        onChoix={setType}
      />
      {visibles.length > 0 && (
        <Carte className="mt-3 px-4 pb-3.5 pt-4">
          <div className="flex items-center">
            <Section>{libelle} · en % du départ</Section>
            <span className="ml-auto whitespace-nowrap font-mono text-[9.5px] text-faint">lissé sur 3 mesures</span>
          </div>
          <svg viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} className="mt-[13px] h-[114px] w-full overflow-visible" role="img" aria-label={`${libelle}, en % du départ`}>
            {[echelle.haut, milieu, echelle.bas].map((v) => (
              <line key={v} x1="0" x2={LARGEUR} y1={y(v)} y2={y(v)} stroke="#EDEAE3" />
            ))}
            <text x="0" y={y(echelle.haut) - 3} fill="#A3A29C" fontSize="8.5" fontFamily="DM Mono, monospace">
              {formatPct(echelle.haut)}
            </text>
            <text x="0" y={y(echelle.bas) + 12} fill="#A3A29C" fontSize="8.5" fontFamily="DM Mono, monospace">
              {formatPct(echelle.bas)}
            </text>
            {traces.map((t, i) => {
              const c = COULEURS[(visibles[i].ordre - 1) % 2];
              const dernier = t.points.at(-1)!;
              return (
                <g key={visibles[i].prenom}>
                  <polyline
                    points={t.points.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke={c}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx={dernier.x} cy={dernier.y} r="4" fill={c} />
                </g>
              );
            })}
          </svg>
          <div className="mt-[11px] flex items-center gap-3.5 text-[10.5px] text-muted">
            {visibles.map((s) => (
              <span key={s.prenom} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: COULEURS[(s.ordre - 1) % 2] }} />
                {s.prenom} {formatPct(s.points.at(-1)!.pct)}
              </span>
            ))}
          </div>
        </Carte>
      )}
    </>
  );
}

/** Le tableau « Chaque mesure » : les dernières dates, poids · taille par personne. */
export function TableauMesures({
  dates,
  lignes,
}: {
  dates: { jour: string; libelle: string }[];
  lignes: { initiales: string; ordre: number; cellules: { poids: string | null; taille: string | null }[] }[];
}) {
  const derniere = dates.length - 1;
  return (
    <Carte className="mt-3 px-4 py-3.5">
      <Section>Chaque mesure</Section>
      <div className="mt-3 grid items-center gap-x-1.5 gap-y-[9px]" style={{ gridTemplateColumns: `52px repeat(${dates.length}, 1fr)` }}>
        <span />
        {dates.map((d) => (
          <span key={d.jour} className="font-mono text-[9px] text-faint">
            {d.libelle}
          </span>
        ))}
        {lignes.map((l) => (
          <LigneTableau key={l.ordre} ligne={l} derniere={derniere} />
        ))}
      </div>
      <div className="mt-[11px] font-mono text-[9px] tracking-[0.03em] text-faint">kg · tour de taille cm</div>
    </Carte>
  );
}

function LigneTableau({
  ligne,
  derniere,
}: {
  ligne: { initiales: string; ordre: number; cellules: { poids: string | null; taille: string | null }[] };
  derniere: number;
}) {
  const couleur = ligne.ordre === 1 ? "text-accent-d" : "text-joker-text";
  return (
    <>
      <span className="scale-[0.77] origin-left">
        <Avatar initiales={ligne.initiales} ordre={ligne.ordre} />
      </span>
      {ligne.cellules.map((c, i) => (
        <span key={i} className={`font-mono text-[11px] ${i === derniere && c.poids ? `font-medium ${couleur}` : ""}`}>
          {c.poids ?? "—"}
          <span className="text-faint"> · {c.taille ?? "—"}</span>
        </span>
      ))}
    </>
  );
}
