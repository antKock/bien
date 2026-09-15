import Link from "next/link";
import { changerRepas, cocherRepas, toutCocher } from "./actions";
import { BoutonPanier } from "@/components/ds/BoutonIcone";
import { Bouton } from "@/components/ds/Bouton";
import { Carte } from "@/components/ds/Carte";
import { Case, CaseBouton } from "@/components/ds/Case";
import { Pad } from "@/components/ds/Ecran";
import { EnteteEmpile, LienAccent } from "@/components/ds/EnteteEmpile";
import { Placeholder } from "@/components/ds/Placeholder";
import { classeBoutonStepper, Stepper } from "@/components/ds/Stepper";
import { resumePlats } from "@/domain/plats";
import { estValidee } from "@/domain/semaine";
import { nomSemaine } from "@/lib/dates";
import { listeDeLaSemaine, platsDeLaSemaine } from "@/lib/plats";
import { contexteSemaine } from "@/lib/semaines";

// Écrans 05 et 18 : la liste des plats retenus. En préparation, un stepper du
// nombre de repas ; en confirmation, une case par repas et « Tout cocher ».
// Le panier mène à la liste de courses dans les deux cas.
export default async function PagePlats({ params }: { params: Promise<{ debut: string }> }) {
  const { debut } = await params;
  const ctx = await contexteSemaine(debut);
  const plats = await platsDeLaSemaine(ctx.semaine, ctx.info);
  const liste = await listeDeLaSemaine(ctx.semaine, plats, ctx.personnes.length);
  const confirmation = estValidee(ctx.info, ctx.jour);
  const cloturee = ctx.etat === "cloturee";
  const r = resumePlats(plats);
  const s = (n: number) => (n > 1 ? "s" : "");
  const sousTitre = confirmation
    ? `${nomSemaine(debut, true)} · confirmation`
    : r.plats === 0
      ? "Aucun plat choisi"
      : `${r.plats} plat${s(r.plats)} · ${r.repas} repas`;
  const resteACocher = plats.some((p) => p.repasCuisines < p.repas);

  return (
    <>
      <EnteteEmpile
        titre="Plats"
        sousTitre={sousTitre}
        retour="/semaines"
        droite={
          cloturee ? undefined : (
            <>
              {confirmation && resteACocher && (
                <form action={toutCocher.bind(null, debut)}>
                  <LienAccent>Tout cocher</LienAccent>
                </form>
              )}
              <BoutonPanier href={`/semaines/${debut}/courses`} badge={liste.nbArticles + liste.libres.length} />
            </>
          )
        }
      />
      <Pad className="flex flex-col gap-3">
        {plats.length > 0 && (
          <Carte className="px-[15px] py-1.5">
            {plats.map((p) => {
              const meta = confirmation
                ? [
                    `${p.repas} repas`,
                    p.nonPrevu ? "non prévu" : null,
                    p.repasCuisines === 0
                      ? null
                      : p.repasCuisines === p.repas
                        ? "cuisiné"
                        : `${p.repasCuisines} cuisiné${p.repasCuisines > 1 ? "s" : ""}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : (p.duree ?? "plat libre");
              return (
                <div key={p.id} className="flex items-center gap-[11px] border-b border-[rgba(226,222,213,.9)] py-[13px] last:border-b-0">
                  <Placeholder className="h-11 w-11 flex-none rounded-[10px]" />
                  <span className="min-w-0 flex-1 text-[13.5px] font-medium leading-[1.3]">
                    {p.nom}
                    <span className="mt-[3px] block font-mono text-[9.5px] tracking-[0.02em] text-faint">{meta}</span>
                  </span>
                  {cloturee ? (
                    <span className="flex flex-none gap-[7px]">
                      {Array.from({ length: p.repas }, (_, i) => (
                        <Case key={i} cochee={i < p.repasCuisines} />
                      ))}
                    </span>
                  ) : confirmation ? (
                    <span className="flex flex-none gap-[7px]">
                      {Array.from({ length: p.repas }, (_, i) => {
                        const cochee = i < p.repasCuisines;
                        return (
                          <form key={i} action={cocherRepas.bind(null, debut, p.id, i + 1, !cochee)} className="flex">
                            <CaseBouton cochee={cochee} libelle={`Repas ${i + 1} de ${p.nom}`} />
                          </form>
                        );
                      })}
                    </span>
                  ) : (
                    <Stepper
                      valeur={p.repas}
                      moins={
                        <form action={changerRepas.bind(null, debut, p.id, -1)} className="flex">
                          <button type="submit" className={classeBoutonStepper} aria-label={p.repas === 1 ? "Retirer" : "Un repas de moins"}>
                            −
                          </button>
                        </form>
                      }
                      plus={
                        <form action={changerRepas.bind(null, debut, p.id, 1)} className="flex">
                          <button type="submit" className={classeBoutonStepper} aria-label="Un repas de plus" disabled={p.repas >= 4}>
                            +
                          </button>
                        </form>
                      }
                    />
                  )}
                </div>
              );
            })}
          </Carte>
        )}
        {!cloturee && (
          <Link href={`/semaines/${debut}/plats/ajouter`}>
            <Bouton variante="secondaire" tabIndex={-1}>
              + Ajouter un plat
            </Bouton>
          </Link>
        )}
      </Pad>
    </>
  );
}
