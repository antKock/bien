import { nomsParId } from "@/db/noms";
import { infoRecette, repertoire, type RecetteChargee } from "@/db/recettes";
import type { SemaineChargee } from "@/db/semaines";
import { listeCourses, type Article, type ListeCourses } from "@/domain/plats";
import { estNonPrevu, type SemaineInfo } from "@/domain/semaine";

// Assemblage des plats d'une semaine avec le répertoire et les noms conservés.
// Pas de règle ici : le calcul est dans `domain/plats`.

export type PlatVue = {
  id: string;
  nom: string;
  duree: RecetteChargee["duree"] | null;
  recette: RecetteChargee | null;
  repas: number;
  repasCuisines: number;
  nonPrevu: boolean;
};

export async function platsDeLaSemaine(
  semaine: SemaineChargee | null,
  info: SemaineInfo,
  recettes?: RecetteChargee[],
): Promise<PlatVue[]> {
  const plats = semaine?.plats ?? [];
  if (plats.length === 0) return [];
  const [toutes, noms] = await Promise.all([
    recettes ?? repertoire(),
    nomsParId(plats.flatMap((p) => (p.nomId ? [p.nomId] : []))),
  ]);
  return [...plats]
    .sort((a, b) => a.creeLe.getTime() - b.creeLe.getTime())
    .map((p) => {
      const recette = p.recetteId ? (toutes.find((r) => r.id === p.recetteId) ?? null) : null;
      return {
        id: p.id,
        nom: recette?.nom ?? noms.get(p.nomId ?? "") ?? "Plat libre",
        duree: recette?.duree ?? null,
        recette,
        repas: p.repas,
        repasCuisines: p.repasCuisines,
        nonPrevu: estNonPrevu(p.creeLe, info),
      };
    });
}

export type ArticleLibre = { id: string; nom: string; cochee: boolean };

export type ListeVue = ListeCourses & {
  /** Les clés cochées, articles déduits. */
  cochees: Set<string>;
  libres: ArticleLibre[];
};

export async function listeDeLaSemaine(semaine: SemaineChargee | null, plats: PlatVue[], personnes: number): Promise<ListeVue> {
  const liste = listeCourses(
    plats.flatMap((p) => (p.recette ? [{ recette: infoRecette(p.recette), repas: p.repas }] : [])),
    personnes,
  );
  const courses = semaine?.courses ?? [];
  const noms = await nomsParId(courses.flatMap((c) => (c.nomId ? [c.nomId] : [])));
  return {
    ...liste,
    cochees: new Set(courses.filter((c) => !c.nomId && c.cochee).map((c) => c.cle)),
    libres: courses
      .filter((c) => c.nomId)
      .map((c) => ({ id: c.id, nom: noms.get(c.nomId!) ?? "", cochee: c.cochee })),
  };
}

export const nbArticles = (a: Article[]) => a.length;
