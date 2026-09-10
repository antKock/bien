import { boolean, pgTable, smallint, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

// Phase 0 : les deux foyers et leurs personnes. Le reste du modèle (Semaine,
// Mesure, Joker, Recette…) arrive en phase 1, après la revue des règles.

export const foyer = pgTable("foyer", {
  id: uuid("id").primaryKey().defaultRandom(),
  // « reel » ou « test » : identifie le foyer indépendamment de son code,
  // pour que le seed et la remise à zéro le retrouvent.
  slug: text("slug").notNull().unique(),
  // Six caractères A-Z 0-9, saisis sur l'écran 01.
  code: text("code").notNull().unique(),
  estTest: boolean("est_test").notNull().default(false),
  creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
});

export const personne = pgTable("personne", {
  id: uuid("id").primaryKey().defaultRandom(),
  foyerId: uuid("foyer_id")
    .notNull()
    .references(() => foyer.id, { onDelete: "cascade" }),
  prenom: text("prenom").notNull(),
  // 1 ou 2 : ordre d'affichage, stable d'un écran à l'autre.
  ordre: smallint("ordre").notNull(),
  creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique("personne_foyer_ordre").on(t.foyerId, t.ordre)]);

export type Foyer = typeof foyer.$inferSelect;
export type Personne = typeof personne.$inferSelect;
