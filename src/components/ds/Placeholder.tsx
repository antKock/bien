// Placeholder d'image (`.ph`) : hachures, libellé mono. Les visuels viennent de
// Mijote (phase 5) ; en attendant, le placeholder plutôt qu'une couleur pleine.
export function Placeholder({ libelle = "img", className = "" }: { libelle?: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={`flex items-center justify-center font-mono text-[8px] text-faint ${className}`}
      style={{ backgroundImage: "repeating-linear-gradient(135deg, #E9E6DE 0 6px, #F3F1EB 6px 12px)" }}
    >
      {libelle}
    </div>
  );
}
