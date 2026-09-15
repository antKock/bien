"use client";

// Onglets (`.tabs`) : piste grise, onglet actif blanc. Toute bascule
// d'affichage passe par là (règle ⑥) : jamais un chip cliquable.
export function Onglets<T extends string>({
  options,
  actif,
  onChoix,
}: {
  options: { valeur: T; libelle: string }[];
  actif: T;
  onChoix: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-[10px] bg-[rgba(26,26,24,.05)] p-[3px]" role="tablist">
      {options.map((o) => {
        const on = o.valeur === actif;
        return (
          <button
            key={o.valeur}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChoix(o.valeur)}
            className={`flex-1 rounded-lg py-[9px] text-center text-[13px] ${
              on ? "bg-white font-semibold text-ink shadow-[0_1px_2px_rgba(0,0,0,.06)]" : "font-medium text-muted"
            }`}
          >
            {o.libelle}
          </button>
        );
      })}
    </div>
  );
}
