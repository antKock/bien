import { validerGrille } from "./actions";
import { Pad } from "@/components/ds/Ecran";
import { EnteteEmpile, LienAccent } from "@/components/ds/EnteteEmpile";
import { GrilleJokers } from "@/components/jokers/GrilleJokers";
import { nomsConserves } from "@/db/noms";
import { caseDe, jourCourantDe } from "@/domain/jokers";
import { jourSemaine } from "@/domain/jours";
import { jokersAJour } from "@/domain/semaine";
import { nomSemaine } from "@/lib/dates";
import { contexteSemaine } from "@/lib/semaines";

// Écrans 04 et 14 à 17 : la jauge, puis la grille des sept soirs. Poser
// d'avance ou confirmer, c'est le même écran.
export default async function PageJokers({ params }: { params: Promise<{ debut: string }> }) {
  const { debut } = await params;
  const ctx = await contexteSemaine(debut);
  const noms = await nomsConserves(ctx.foyer.id, "autre");
  const cases = (ctx.semaine?.ecarts ?? []).map((e) => caseDe(e, ctx.info));
  const enCours = ctx.etat === "en_cours" && ctx.jour >= ctx.debut;
  const aValider = ctx.etat === "a_confirmer" && !jokersAJour(ctx.info);

  return (
    <>
      <EnteteEmpile
        titre="Jokers"
        sousTitre={nomSemaine(debut, ctx.etat === "a_confirmer" || ctx.etat === "cloturee")}
        retour="/semaines"
        droite={
          aValider ? (
            <form action={validerGrille.bind(null, debut)}>
              <LienAccent>Valider</LienAccent>
            </form>
          ) : undefined
        }
      />
      <Pad>
        <GrilleJokers
          debut={debut}
          cases={cases}
          nomsAutre={noms.map((n) => n.libelle)}
          modifiable={ctx.etat !== "cloturee"}
          jourCourant={jourCourantDe(ctx.info, ctx.jour)}
          jourEnEvidence={enCours ? jourSemaine(ctx.jour) : null}
          nouveauxPrevus={ctx.etat === "a_preparer"}
        />
      </Pad>
    </>
  );
}
