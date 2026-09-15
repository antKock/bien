import { notFound } from "next/navigation";
import { EnteteEmpile } from "@/components/ds/EnteteEmpile";
import { ChoixPlats } from "@/components/plats/ChoixPlats";
import { nomsConserves } from "@/db/noms";
import { repertoire } from "@/db/recettes";
import { synchroniserCarnet } from "@/lib/mijote";
import { contexteSemaine } from "@/lib/semaines";

// Écran 06 : ajouter un plat. Les plats déjà retenus n'apparaissent pas.
export default async function PageAjouterPlat({ params }: { params: Promise<{ debut: string }> }) {
  const { debut } = await params;
  const ctx = await contexteSemaine(debut);
  if (ctx.etat === "cloturee") notFound();
  // Le répertoire, c'est le carnet Mijote : on le relit à l'ouverture, sans bloquer si Mijote se tait.
  await synchroniserCarnet();
  const [recettes, noms] = await Promise.all([repertoire(true), nomsConserves(ctx.foyer.id, "plat_libre")]);
  const retenues = new Set((ctx.semaine?.plats ?? []).map((p) => p.recetteId));
  const n = ctx.semaine?.plats.length ?? 0;
  return (
    <>
      <EnteteEmpile
        titre="Ajouter un plat"
        sousTitre={n === 0 ? "Aucun retenu" : `${n} déjà retenu${n > 1 ? "s" : ""}`}
        retour={`/semaines/${debut}/plats`}
      />
      <ChoixPlats
        debut={debut}
        tuiles={recettes
          .filter((r) => !retenues.has(r.id))
          .map((r) => ({ id: r.id, nom: r.nom, duree: r.duree, nbArticles: r.ingredients.length, image: r.imageUrl }))}
        nomsLibres={noms.map((x) => x.libelle)}
      />
    </>
  );
}
