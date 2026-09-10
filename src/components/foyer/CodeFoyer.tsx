"use client";

import { useActionState, useId, useState } from "react";
import { entrerCode, type EtatCode } from "@/app/foyer/actions";
import { Bouton } from "@/components/ds/Bouton";
import { Carte } from "@/components/ds/Carte";
import { Section } from "@/components/ds/Section";
import { LONGUEUR_CODE, normaliserCode } from "@/domain/code-foyer";

// Écran 01 : six cases, un CTA. Une seule vraie zone de saisie, invisible,
// posée sur les cases (toucher une case, c'est la toucher) : le clavier est
// celui du système, le collage marche, et les cases ne font qu'afficher.
export function CodeFoyer() {
  const [etat, action, enCours] = useActionState<EtatCode, FormData>(entrerCode, {});
  const [code, setCode] = useState("");
  const [focus, setFocus] = useState(false);
  const idErreur = useId();
  const curseur = Math.min(code.length, LONGUEUR_CODE - 1);

  return (
    <form action={action} className="flex flex-col">
      <Carte className="px-[17px] py-[18px]">
        <Section className="mb-2.5 text-muted">Code foyer</Section>
        <div className="relative grid grid-cols-6 gap-[7px]">
          {Array.from({ length: LONGUEUR_CODE }, (_, i) => {
            const actif = focus && i === curseur && code.length < LONGUEUR_CODE;
            return (
              <span
                key={i}
                aria-hidden
                className={`flex h-[52px] items-center justify-center rounded-field border-[1.5px] bg-white font-mono text-[20px] text-ink ${
                  actif ? "border-accent shadow-focus" : "border-border"
                }`}
              >
                {code[i] ?? (actif ? <span className="h-[22px] w-[2px] bg-accent" /> : null)}
              </span>
            );
          })}
          <input
            name="code"
            value={code}
            onChange={(e) => setCode(normaliserCode(e.target.value))}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            autoFocus
            autoCapitalize="characters"
            autoComplete="one-time-code"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            maxLength={LONGUEUR_CODE}
            aria-label="Code foyer, six caractères"
            aria-invalid={etat.erreur ? true : undefined}
            aria-describedby={etat.erreur ? idErreur : undefined}
            className="absolute inset-0 h-full w-full cursor-default opacity-0"
          />
        </div>
      </Carte>
      {etat.erreur && (
        <p id={idErreur} className="mt-3 text-center text-[12.5px] text-muted" role="status">
          {etat.erreur}
        </p>
      )}
      <Bouton type="submit" className="mt-4" disabled={enCours}>
        Continuer
      </Bouton>
    </form>
  );
}
