"use client";

import { useState, useTransition } from "react";
import { noterMesure } from "@/app/(pile)/semaines/[debut]/mesures/actions";
import type { TypeMesure } from "@/domain/mesures";

// Le champ inline (`.field`) : un grand chiffre souligné, son unité, aucun
// bouton. Enregistré à la sortie du champ ou sur Entrée.
export function ChampMesure({
  debut,
  personneId,
  type,
  valeur,
  unite,
  modifiable,
}: {
  debut: string;
  personneId: string;
  type: TypeMesure;
  valeur: number | null;
  unite: string;
  modifiable: boolean;
}) {
  const initiale = valeur === null ? "" : String(valeur).replace(".", ",");
  const [saisie, setSaisie] = useState(initiale);
  const [erreur, setErreur] = useState<string | null>(null);
  const [focus, setFocus] = useState(false);
  const [, lancer] = useTransition();

  function enregistrer() {
    if (saisie === initiale) return;
    lancer(async () => {
      const r = await noterMesure(debut, personneId, type, saisie);
      setErreur(r.erreur ?? null);
    });
  }

  const vide = saisie.trim() === "";
  const actif = focus || (!vide && modifiable);
  return (
    <div>
      <div className={`flex items-baseline gap-[5px] border-b-2 pb-1 ${actif ? "border-soft2" : "border-border"}`}>
        <input
          type="text"
          inputMode="decimal"
          enterKeyHint="done"
          value={saisie}
          disabled={!modifiable}
          placeholder="—"
          onChange={(e) => setSaisie(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => {
            setFocus(false);
            enregistrer();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className={`w-full min-w-0 bg-transparent font-disp text-[30px] font-medium leading-none tracking-[-0.6px] outline-none placeholder:font-disp placeholder:text-box ${
            actif ? "text-ink" : "text-faint"
          } caret-accent`}
        />
        <i className="font-mono text-[12px] not-italic text-faint">{unite}</i>
      </div>
      {erreur && <div className="mt-1.5 text-[11.5px] text-muted">{erreur}</div>}
    </div>
  );
}
