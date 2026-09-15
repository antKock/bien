"use client";

import { useTransition } from "react";
import { fixerJourTest } from "@/app/(app)/jour-test/actions";

// Foyer de test seulement : choisir le jour que l'app croit être, pour
// rejouer un dimanche, remplir des semaines, regarder Tendances.
export function JourTest({ jour, simule }: { jour: string; simule: boolean }) {
  const [enCours, lancer] = useTransition();
  return (
    <div className="mt-2 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.13em] text-faint">
      <label className="flex items-center gap-2">
        <span>{simule ? "jour simulé" : "jour réel"}</span>
        <input
          type="date"
          value={jour}
          disabled={enCours}
          onChange={(e) => lancer(() => fixerJourTest(e.target.value || null))}
          className="rounded-btn border border-dashed border-chevron bg-transparent px-2 py-1 font-mono text-[11px] normal-case tracking-normal text-muted"
        />
      </label>
      {simule && (
        <button type="button" disabled={enCours} onClick={() => lancer(() => fixerJourTest(null))} className="text-accent">
          réel
        </button>
      )}
    </div>
  );
}
