import { notFound } from "next/navigation";
import { FormulaireSeance } from "@/components/activite/FormulaireSeance";
import { EnteteEmpile } from "@/components/ds/EnteteEmpile";
import { nomsConserves } from "@/db/noms";
import { contexteSemaine } from "@/lib/semaines";

// Écran 10 : ajouter une séance. Le CTA ajoute et revient à l'activité ; le
// chevron retour annule.
export default async function PageAjouterSeance({ params }: { params: Promise<{ debut: string }> }) {
  const { debut } = await params;
  const ctx = await contexteSemaine(debut);
  if (ctx.etat === "cloturee") notFound();
  const noms = await nomsConserves(ctx.foyer.id, "activite");
  const n = ctx.semaine?.seances.length ?? 0;
  return (
    <>
      <EnteteEmpile
        titre="Ajouter une séance"
        sousTitre={n === 0 ? "Aucune posée" : `${n} déjà posée${n > 1 ? "s" : ""}`}
        retour={`/semaines/${debut}/activite`}
      />
      <FormulaireSeance
        debut={debut}
        personnes={ctx.personnes.map((p) => ({ id: p.id, prenom: p.prenom }))}
        nomsActivite={noms.map((x) => x.libelle)}
      />
    </>
  );
}
