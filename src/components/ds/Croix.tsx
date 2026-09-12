// La croix de retrait (`.rm`) : en fin de ligne, en préparation seulement (règle ④).
export function Croix({ libelle }: { libelle: string }) {
  return (
    <button
      type="submit"
      aria-label={libelle}
      className="flex h-8 w-8 flex-none items-center justify-center text-[20px] leading-none text-[#CFCAC0]"
    >
      ×
    </button>
  );
}
