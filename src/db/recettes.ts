import { asc, inArray } from "drizzle-orm";
import { db } from "./index";
import { ingredient, recette, type Ingredient, type Recette } from "./schema";
import type { RecetteInfo } from "@/domain/plats";

export type RecetteChargee = Recette & { ingredients: Ingredient[] };

export function infoRecette(r: RecetteChargee): RecetteInfo {
  return {
    nom: r.nom,
    portionsParLot: r.portionsParLot,
    scalabilite: r.scalabilite,
    ingredients: r.ingredients.map((i) => ({ nom: i.nom, quantite: i.quantite, unite: i.unite, rayon: i.rayon })),
  };
}

/** Le répertoire complet, avec ses ingrédients, par nom. */
export async function repertoire(): Promise<RecetteChargee[]> {
  const recettes = await db().select().from(recette).orderBy(asc(recette.nom));
  if (recettes.length === 0) return [];
  const ingredients = await db()
    .select()
    .from(ingredient)
    .where(
      inArray(
        ingredient.recetteId,
        recettes.map((r) => r.id),
      ),
    )
    .orderBy(asc(ingredient.ordre));
  return recettes.map((r) => ({ ...r, ingredients: ingredients.filter((i) => i.recetteId === r.id) }));
}
