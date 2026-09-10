import type { ReactNode } from "react";

// Étiquette d'état, jamais cliquable (règle ⑥). `acc` pour l'accent, `pose`
// pour l'ochre des jokers, `test` pour le marqueur pointillé du foyer de test.
const tons = {
  neutre: "bg-[rgba(26,26,24,.05)] text-muted",
  acc: "bg-soft text-accent-d",
  pose: "bg-[rgba(160,134,60,.14)] text-[#7a6425]",
  test: "border border-dashed border-chevron text-muted",
};

export function Chip({ children, ton = "neutre" }: { children: ReactNode; ton?: keyof typeof tons }) {
  return (
    <span className={`inline-flex h-[26px] items-center rounded-pill px-2.5 text-[11.5px] font-medium ${tons[ton]}`}>
      {children}
    </span>
  );
}
