import Link from "next/link";
import type { ReactNode } from "react";
import { ICONES, type Sujet } from "./Icones";

// La carte de semaine (`.wkcard`) : en-tête, quatre lignes de sujet toujours
// dans le même ordre, un pied. Ses quatre états ne changent que le contenu
// des lignes et du pied ; la carte passée est atténuée et non cliquable.

export type TonIcone = "vide" | "plein" | "jokers" | "fait";
const tonsIcone: Record<TonIcone, string> = {
  vide: "bg-[rgba(26,26,24,.05)] text-nav-off",
  plein: "bg-soft text-accent-d",
  jokers: "bg-[rgba(160,134,60,.14)] text-pose-text",
  fait: "bg-[rgba(70,112,122,.07)] text-accent",
};

export type LigneSujet = {
  sujet: Sujet;
  libelle: string;
  sousTitre: string;
  /** Le sous-titre d'un sujet vide, en plus pâle. */
  aFaire?: boolean;
  ton: TonIcone;
  /** Navigation ; absent quand la ligne n'ouvre rien. */
  href?: string;
  /** Pastille de confirmation à droite, à la place du chevron. */
  pastille?: { texte: string; ton?: "accent" | "jokers" };
};

export function CarteSemaine({
  titre,
  chip,
  lignes,
  pied,
  passee = false,
}: {
  titre: ReactNode;
  chip: ReactNode;
  lignes: LigneSujet[];
  pied?: ReactNode;
  passee?: boolean;
}) {
  return (
    <section
      className={`overflow-hidden rounded-week border ${
        passee ? "border-[#DEDACF] bg-[rgba(255,255,255,.62)]" : "border-border bg-white shadow-card"
      }`}
    >
      <header className="flex items-center gap-2.5 px-[17px] pb-[13px] pt-[15px]">
        <h2 className={`font-disp text-[19px] font-medium tracking-[-0.2px] ${passee ? "text-muted" : ""}`}>{titre}</h2>
        <span className="ml-auto">{chip}</span>
      </header>
      <div className={`px-[17px] ${passee ? "opacity-75" : ""}`}>
        {lignes.map((l) => (
          <Ligne key={l.sujet} ligne={l} />
        ))}
      </div>
      {pied && <footer className="flex items-center gap-2.5 px-[17px] pb-4 pt-3.5">{pied}</footer>}
    </section>
  );
}

function Ligne({ ligne }: { ligne: LigneSujet }) {
  const contenu = (
    <>
      <span className={`flex h-[34px] w-[34px] flex-none items-center justify-center rounded-ic ${tonsIcone[ligne.ton]}`}>
        {ICONES[ligne.sujet]}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-[14.5px] font-semibold leading-[1.2]">{ligne.libelle}</b>
        <span className={`mt-[3px] block text-[12.5px] leading-[1.35] ${ligne.aFaire ? "text-faint" : "text-muted"}`}>
          {ligne.sousTitre}
        </span>
      </span>
      {ligne.pastille ? (
        <span
          className={`ml-auto flex-none font-mono text-[9.5px] uppercase tracking-[0.08em] ${
            ligne.pastille.ton === "jokers" ? "text-pose-text" : "text-accent"
          }`}
        >
          {ligne.pastille.texte}
        </span>
      ) : ligne.href ? (
        <span className="ml-auto flex-none text-[16px] text-chevron">›</span>
      ) : null}
    </>
  );
  const classes = "flex items-center gap-3 px-0.5 py-[13px] border-t border-[rgba(226,222,213,.9)] first:border-t-0";
  return ligne.href ? (
    <Link href={ligne.href} className={classes}>
      {contenu}
    </Link>
  ) : (
    <div className={classes}>{contenu}</div>
  );
}

/** La carte fantôme : la semaine à suivre, son nom, un chip, rien de plus. Non cliquable. */
export function CarteFantome({ titre, chip }: { titre: string; chip: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-week border border-dashed border-dash bg-[rgba(255,255,255,.45)] px-[17px] py-4">
      <span className="font-disp text-[17px] font-medium text-muted">{titre}</span>
      <span className="ml-auto">{chip}</span>
    </div>
  );
}

/** Une semaine passée réduite à son nom et son état. */
export function CarteReduite({ titre, chip, onClick }: { titre: string; chip: ReactNode; onClick?: () => void }) {
  const classes = "flex w-full items-center gap-2.5 rounded-card border border-border bg-white px-4 py-3.5 text-left shadow-card";
  const contenu = (
    <>
      <span className="font-disp text-[16px] font-medium">{titre}</span>
      <span className="ml-auto">{chip}</span>
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={classes}>
      {contenu}
    </button>
  ) : (
    <div className={`${classes} opacity-70`}>{contenu}</div>
  );
}
