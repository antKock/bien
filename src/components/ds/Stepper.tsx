// Le stepper (`.stp`) : « − ×3 + ». Sert au nombre de repas d'un plat, et à rien d'autre.
export function Stepper({ valeur, moins, plus }: { valeur: number; moins: React.ReactNode; plus: React.ReactNode }) {
  return (
    <span className="flex h-[34px] flex-none items-center gap-0.5 rounded-[10px] border border-border bg-white px-0.5">
      {moins}
      <em className="min-w-[44px] text-center font-mono text-[12.5px] not-italic text-ink">×{valeur}</em>
      {plus}
    </span>
  );
}

export const classeBoutonStepper = "flex h-8 w-7 items-center justify-center text-[16px] text-accent-d";
