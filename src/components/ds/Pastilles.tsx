"use client";

// Pastilles de sélection (`.seg`) : une question courte, une réponse parmi
// plusieurs. Servent aux formulaires d'ajout : qui, quoi, quel jour, quel créneau.
export type Option<T extends string> = { valeur: T; libelle: string };

export function Pastilles<T extends string>({
  options,
  choix,
  onChoix,
}: {
  options: Option<T>[];
  choix: T | null;
  onChoix: (valeur: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup">
      {options.map((o) => {
        const on = o.valeur === choix;
        return (
          <button
            key={o.valeur}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChoix(o.valeur)}
            className={`inline-flex h-[30px] items-center rounded-pill border px-3 text-[12px] ${
              on ? "border-soft2 bg-soft font-semibold text-accent-d" : "border-border bg-white text-muted"
            }`}
          >
            {o.libelle}
          </button>
        );
      })}
    </div>
  );
}
