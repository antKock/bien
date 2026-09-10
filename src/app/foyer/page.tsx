import { Ecran, Pad } from "@/components/ds/Ecran";
import { CodeFoyer } from "@/components/foyer/CodeFoyer";

// Écran 01 · Code foyer. Pas de création de foyer, pas d'onboarding : un code,
// et on arrive sur la première semaine. Aussi la cible du lien « changer de foyer ».
export default function PageFoyer() {
  return (
    <Ecran>
      <Pad className="flex flex-1 flex-col justify-center pb-16">
        <div className="text-center font-disp text-[34px] font-medium tracking-[-0.5px]">Bien</div>
        <p className="mx-auto mt-3 max-w-[270px] text-center text-[14px] leading-[1.55] text-muted">
          Entre le code de ton foyer pour retrouver vos semaines.
        </p>
        <div className="mt-8">
          <CodeFoyer />
        </div>
      </Pad>
    </Ecran>
  );
}
