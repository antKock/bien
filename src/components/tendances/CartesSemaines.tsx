import { Carte } from "@/components/ds/Carte";
import { Section } from "@/components/ds/Section";
import { BUDGET_JOKERS, type TypeEcart } from "@/domain/jokers";

// Jokers : une paire de barres par semaine, posés en clair et consommés en
// foncé, puis la fréquence des cinq types. Activité : un jeton par semaine
// et par personne. Sans score, sans série.
const LIBELLES: Record<TypeEcart, string> = { apero_riche: "apéro", alcool: "alcool", repas_riche: "repas", extra_sucre: "sucré", autre: "autre" };
const HAUTEUR_BARRE = 56;

export function CarteJokers({
  semaines,
  frequence,
}: {
  semaines: { debut: string; pose: number; consomme: number }[];
  frequence: Record<TypeEcart, number>;
}) {
  const max = Math.max(BUDGET_JOKERS, ...semaines.map((s) => Math.max(s.pose, s.consomme)));
  const h = (v: number) => Math.round((v / max) * HAUTEUR_BARRE);
  const types: TypeEcart[] = [
    ...(Object.keys(LIBELLES) as TypeEcart[]).filter((t) => t !== "autre").sort((a, b) => frequence[b] - frequence[a]),
    "autre",
  ];
  return (
    <Carte className="mt-3 px-4 pb-3.5 pt-[15px]">
      <Section>Jokers · consommés vs posés</Section>
      <div className="mt-[13px] flex items-end gap-[11px]">
        {semaines.map((s) => (
          <div key={s.debut} className="flex items-end gap-[3px]" style={{ height: HAUTEUR_BARRE }} aria-label={`semaine du ${s.debut} : ${s.pose} posés, ${s.consomme} consommés`}>
            <u className="block w-[9px] rounded-t-[2px] no-underline" style={{ height: h(s.pose), background: "rgba(160,134,60,.28)" }} />
            <u className="block w-[9px] rounded-t-[2px] no-underline" style={{ height: h(s.consomme), background: "#A0863C" }} />
          </div>
        ))}
        <div className="ml-auto text-right font-mono text-[9px] text-faint">
          <div>posés</div>
          <div className="text-pose-text">consommés</div>
        </div>
      </div>
      <div className="mt-3.5 grid grid-cols-5 gap-1.5 border-t border-border pt-3">
        {types.map((t) => (
          <span key={t} className="flex flex-col items-center gap-[3px] font-mono text-[8.5px] tracking-[0.03em] text-faint">
            <b className={`font-disp text-[16px] font-medium tracking-normal ${t === "autre" ? "text-joker" : "text-pose-text"}`}>{frequence[t]}</b>
            {LIBELLES[t]}
          </span>
        ))}
      </div>
    </Carte>
  );
}

export function CarteActivite({ personnes }: { personnes: { prenom: string; semaines: boolean[] }[] }) {
  return (
    <Carte className="mt-3 px-4 pb-3.5 pt-[15px]">
      <Section>Activité</Section>
      {personnes.map((p) => (
        <div key={p.prenom} className="mt-2 flex items-center gap-[7px] first-of-type:mt-3">
          <span className="w-[60px] text-[12.5px] text-muted">{p.prenom}</span>
          {p.semaines.map((faite, i) => (
            <span
              key={i}
              aria-label={faite ? "séance faite" : "aucune séance faite"}
              className={`h-5 w-5 rounded-full border ${faite ? "border-soft2 bg-soft" : "border-border"}`}
            />
          ))}
        </div>
      ))}
    </Carte>
  );
}
