import { Avatar } from "@/components/ds/Avatar";
import { Carte } from "@/components/ds/Carte";
import { Pad } from "@/components/ds/Ecran";
import { EnteteEmpile } from "@/components/ds/EnteteEmpile";
import { Section } from "@/components/ds/Section";
import { ChampMesure } from "@/components/mesures/ChampMesure";
import { formatPoids } from "@/components/semaine/copie";
import { semainesDuFoyer } from "@/db/semaines";
import { dernieres } from "@/domain/mesures";
import { initiales } from "@/domain/personnes";
import { dimanchePreparation } from "@/domain/semaine";
import { jourAvecNom, jourCourt } from "@/lib/dates";
import { contexteSemaine } from "@/lib/semaines";

// Écran 03 : une carte par personne, poids et tour de taille en champs inline,
// l'historique des trois derniers poids. Aucun bouton.
export default async function PageMesures({ params }: { params: Promise<{ debut: string }> }) {
  const { debut } = await params;
  const ctx = await contexteSemaine(debut);
  const toutes = await semainesDuFoyer(ctx.foyer.id);
  const modifiable = ctx.etat !== "cloturee";
  const ini = initiales(ctx.personnes.map((p) => p.prenom));

  return (
    <>
      <EnteteEmpile titre="Mesures" sousTitre={`${jourAvecNom(dimanchePreparation(debut))} · au réveil, à jeun`} retour="/semaines" />
      <Pad className="flex flex-col gap-3">
        {ctx.personnes.map((p, i) => {
          const valeur = (type: "poids" | "tour_taille") =>
            ctx.semaine?.mesures.find((m) => m.personneId === p.id && m.type === type)?.valeur ?? null;
          const historique = dernieres(
            toutes
              .filter((s) => s.debut < debut)
              .flatMap((s) =>
                s.mesures
                  .filter((m) => m.personneId === p.id && m.type === "poids")
                  .map((m) => ({ jour: dimanchePreparation(s.debut), valeur: m.valeur })),
              ),
          );
          return (
            <Carte key={p.id} className={`px-[17px] py-4 ${i === 0 ? "border-soft2" : ""}`}>
              <div className="flex items-center">
                <Avatar initiales={ini[i]} ordre={p.ordre} />
                <span className="ml-[9px] text-[14.5px] font-semibold">{p.prenom}</span>
              </div>
              <div className="mt-[15px] flex items-end gap-[18px]">
                <div className="flex-1">
                  <Section className="mb-[7px]">Poids</Section>
                  <ChampMesure debut={debut} personneId={p.id} type="poids" valeur={valeur("poids")} unite="kg" modifiable={modifiable} />
                </div>
                <div className="flex-1">
                  <Section className="mb-[7px]">Tour de taille</Section>
                  <ChampMesure debut={debut} personneId={p.id} type="tour_taille" valeur={valeur("tour_taille")} unite="cm" modifiable={modifiable} />
                </div>
              </div>
              {historique.length > 0 && (
                <div className="mt-3 flex gap-3.5 border-t border-border pt-[11px]">
                  {historique.map((h) => (
                    <span key={h.jour} className="font-mono text-[10.5px] text-muted">
                      {jourCourt(h.jour)} · {formatPoids(h.valeur)}
                    </span>
                  ))}
                </div>
              )}
            </Carte>
          );
        })}
      </Pad>
    </>
  );
}
