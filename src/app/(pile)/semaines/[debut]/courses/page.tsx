import { ListeCourses } from "@/components/courses/ListeCourses";
import { EnteteEmpile } from "@/components/ds/EnteteEmpile";
import { nomsConserves } from "@/db/noms";
import { listeDeLaSemaine, platsDeLaSemaine } from "@/lib/plats";
import { contexteSemaine } from "@/lib/semaines";

// Écran 08 : la liste de courses de la semaine.
export default async function PageCourses({ params }: { params: Promise<{ debut: string }> }) {
  const { debut } = await params;
  const ctx = await contexteSemaine(debut);
  const plats = await platsDeLaSemaine(ctx.semaine, ctx.info);
  const [liste, noms] = await Promise.all([
    listeDeLaSemaine(ctx.semaine, plats, ctx.personnes.length),
    nomsConserves(ctx.foyer.id, "article"),
  ]);
  const n = liste.nbArticles + liste.libres.length;
  const p = liste.parPlat.length;
  return (
    <>
      <EnteteEmpile
        titre="La liste"
        sousTitre={`${n} article${n > 1 ? "s" : ""} · ${p} plat${p > 1 ? "s" : ""}`}
        retour={`/semaines/${debut}/plats`}
      />
      <ListeCourses
        debut={debut}
        parRayon={liste.parRayon}
        parPlat={liste.parPlat}
        cochees={[...liste.cochees]}
        libres={liste.libres}
        nomsArticles={noms.map((x) => x.libelle)}
        modifiable={ctx.etat !== "cloturee"}
      />
    </>
  );
}
