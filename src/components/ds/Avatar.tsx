// Avatar d'une personne (`.av`) : 26 px, initiales en mono. Accent pour la
// première personne du foyer, terracotta doux pour la seconde.
const tons = ["bg-soft text-accent-d", "bg-[rgba(176,103,59,.14)] text-joker-text"];

export function Avatar({ initiales, ordre }: { initiales: string; ordre: number }) {
  return (
    <span
      aria-hidden
      className={`flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full font-mono text-[10px] ${tons[(ordre - 1) % 2]}`}
    >
      {initiales}
    </span>
  );
}
