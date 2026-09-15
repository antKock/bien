import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Modèle complet (phase 1). Les règles de calcul vivent dans `src/domain/` ;
// ici, seulement ce qui est stocké. Les décisions qui justifient chaque table
// sont dans docs/32.decisions-dev.md, section phase 1.

const horodatage = (nom: string) => timestamp(nom, { withTimezone: true });
const creeLe = () => horodatage("cree_le").notNull().defaultNow();
// La trace : `cree_le` et le dernier `modifie_le`, rien d'autre.
const modifieLe = () => horodatage("modifie_le");

// ---------------------------------------------------------------- foyers

export const foyer = pgTable("foyer", {
  id: uuid("id").primaryKey().defaultRandom(),
  // « reel » ou « test » : identifie le foyer indépendamment de son code,
  // pour que le seed et la remise à zéro le retrouvent.
  slug: text("slug").notNull().unique(),
  // Six caractères A-Z 0-9, saisis sur l'écran 01.
  code: text("code").notNull().unique(),
  estTest: boolean("est_test").notNull().default(false),
  creeLe: creeLe(),
});

export const personne = pgTable(
  "personne",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    foyerId: uuid("foyer_id")
      .notNull()
      .references(() => foyer.id, { onDelete: "cascade" }),
    prenom: text("prenom").notNull(),
    // 1 ou 2 : ordre d'affichage, stable d'un écran à l'autre.
    ordre: smallint("ordre").notNull(),
    creeLe: creeLe(),
  },
  (t) => [unique("personne_foyer_ordre").on(t.foyerId, t.ordre)],
);

// ---------------------------------------------------------------- semaine

// Une semaine n'a pas de colonne d'état : ses horodatages suffisent.
// - validee_le vide = validée automatiquement le dimanche minuit qui précède.
// - cloturee_le vide = jamais clôturée à la main (ou rouverte).
// - rouverte_le garde chaque réouverture.
export const semaine = pgTable(
  "semaine",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    foyerId: uuid("foyer_id")
      .notNull()
      .references(() => foyer.id, { onDelete: "cascade" }),
    // Le lundi, en date civile (heure de Paris).
    debut: date("debut").notNull(),
    valideeLe: horodatage("validee_le"),
    clotureeLe: horodatage("cloturee_le"),
    rouverteLe: horodatage("rouverte_le").array().notNull().default(sql`'{}'`),
    // Le geste « Valider » de la grille des jokers en confirmation.
    jokersValidesLe: horodatage("jokers_valides_le"),
    creeLe: creeLe(),
  },
  (t) => [unique("semaine_foyer_debut").on(t.foyerId, t.debut)],
);

// ---------------------------------------------------------------- mesures

export const typeMesure = pgEnum("type_mesure", ["poids", "tour_taille"]);

// Une mesure par (personne, semaine, type), rattachée à la semaine qu'elle
// ouvre : sa date affichée est le dimanche de préparation (début − 1).
export const mesure = pgTable(
  "mesure",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    semaineId: uuid("semaine_id")
      .notNull()
      .references(() => semaine.id, { onDelete: "cascade" }),
    personneId: uuid("personne_id")
      .notNull()
      .references(() => personne.id, { onDelete: "cascade" }),
    type: typeMesure("type").notNull(),
    // kg à une décimale, ou cm entiers.
    valeur: numeric("valeur", { precision: 5, scale: 1, mode: "number" }).notNull(),
    creeLe: creeLe(),
    modifieLe: modifieLe(),
  },
  (t) => [unique("mesure_semaine_personne_type").on(t.semaineId, t.personneId, t.type)],
);

// ---------------------------------------------------------------- noms conservés

// Les noms saisis librement, conservés et reproposés : « autre » des jokers,
// plat libre, activité « autre ». Une table pour les trois usages.
export const usageNom = pgEnum("usage_nom", ["autre", "plat_libre", "activite", "article"]);

export const nomConserve = pgTable(
  "nom_conserve",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    foyerId: uuid("foyer_id")
      .notNull()
      .references(() => foyer.id, { onDelete: "cascade" }),
    usage: usageNom("usage").notNull(),
    libelle: text("libelle").notNull(),
    creeLe: creeLe(),
  },
  (t) => [uniqueIndex("nom_conserve_unique").on(t.foyerId, t.usage, sql`lower(${t.libelle})`)],
);

// ---------------------------------------------------------------- jokers

export const typeEcart = pgEnum("type_ecart", ["apero_riche", "alcool", "repas_riche", "extra_sucre", "autre"]);

// L'entité est l'écart : une case cochée de la grille 7 × 5. Le coût de la
// soirée se dérive. Un écart prévu décoché après validation n'est pas
// supprimé : il reçoit `retire_le` (recocher l'annule).
export const ecart = pgTable(
  "ecart",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    semaineId: uuid("semaine_id")
      .notNull()
      .references(() => semaine.id, { onDelete: "cascade" }),
    // 1 = lundi … 7 = dimanche.
    jour: smallint("jour").notNull(),
    type: typeEcart("type").notNull(),
    // Obligatoire pour « autre », absent sinon.
    nomId: uuid("nom_id").references(() => nomConserve.id),
    creeLe: creeLe(),
    modifieLe: modifieLe(),
    retireLe: horodatage("retire_le"),
  },
  (t) => [
    unique("ecart_semaine_jour_type").on(t.semaineId, t.jour, t.type),
    check("ecart_jour", sql`${t.jour} BETWEEN 1 AND 7`),
    check("ecart_autre_nomme", sql`(${t.type} = 'autre') = (${t.nomId} IS NOT NULL)`),
  ],
);

// ---------------------------------------------------------------- répertoire

export const dureeRecette = pgEnum("duree_recette", ["express", "rapide", "long"]);
export const scalabilite = pgEnum("scalabilite", ["continu", "par_lot"]);
export const rayon = pgEnum("rayon", [
  "primeur",
  "boucher",
  "poissonnier",
  "cremerie",
  "epicerie",
  "surgeles",
  // Ne suit pas les lots : quantité « à vérifier ».
  "epices_base",
]);

// Le répertoire est commun aux deux foyers. Titre, photo et lien viendront
// de Mijote (phase 5) ; portions, scalabilité et ingrédients vivent ici.
export const recette = pgTable("recette", {
  id: uuid("id").primaryKey().defaultRandom(),
  nom: text("nom").notNull(),
  duree: dureeRecette("duree").notNull(),
  // Rendement d'une exécution, en portions. Jamais un nombre de soirs.
  portionsParLot: smallint("portions_par_lot").notNull(),
  scalabilite: scalabilite("scalabilite").notNull(),
  mijoteId: text("mijote_id").unique(),
  imageUrl: text("image_url"),
  lienUrl: text("lien_url"),
  creeLe: creeLe(),
});

export const ingredient = pgTable("ingredient", {
  id: uuid("id").primaryKey().defaultRandom(),
  recetteId: uuid("recette_id")
    .notNull()
    .references(() => recette.id, { onDelete: "cascade" }),
  nom: text("nom").notNull(),
  // Pour une portion_par_lot de la recette. Vide pour « épices & base ».
  quantite: numeric("quantite", { precision: 8, scale: 2, mode: "number" }),
  unite: text("unite"),
  rayon: rayon("rayon").notNull(),
  ordre: smallint("ordre").notNull().default(0),
});

// ---------------------------------------------------------------- plats de la semaine

// Une recette du répertoire ou un plat libre (nom conservé), jamais les deux.
export const platSemaine = pgTable(
  "plat_semaine",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    semaineId: uuid("semaine_id")
      .notNull()
      .references(() => semaine.id, { onDelete: "cascade" }),
    recetteId: uuid("recette_id").references(() => recette.id),
    nomId: uuid("nom_id").references(() => nomConserve.id),
    // « Combien de fois on le mange » : 1 à 4.
    repas: smallint("repas").notNull().default(1),
    // Confirmation : une case par repas, le modèle compte.
    repasCuisines: smallint("repas_cuisines").notNull().default(0),
    creeLe: creeLe(),
    modifieLe: modifieLe(),
  },
  (t) => [
    unique("plat_semaine_recette").on(t.semaineId, t.recetteId),
    unique("plat_semaine_nom").on(t.semaineId, t.nomId),
    check("plat_semaine_source", sql`(${t.recetteId} IS NULL) <> (${t.nomId} IS NULL)`),
    check("plat_semaine_repas", sql`${t.repas} BETWEEN 1 AND 4 AND ${t.repasCuisines} BETWEEN 0 AND ${t.repas}`),
  ],
);

// ---------------------------------------------------------------- liste de courses

// La liste se recalcule depuis les plats ; on ne stocke que ce qu'elle ne
// peut pas déduire : les articles cochés (« réglé ») et ceux ajoutés à la main.
export const course = pgTable(
  "course",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    semaineId: uuid("semaine_id")
      .notNull()
      .references(() => semaine.id, { onDelete: "cascade" }),
    // Article déduit : nom normalisé + unité. Article à la main : « libre:<nom_id> ».
    cle: text("cle").notNull(),
    // Présent pour un article ajouté à la main.
    nomId: uuid("nom_id").references(() => nomConserve.id),
    cochee: boolean("cochee").notNull().default(false),
    creeLe: creeLe(),
    modifieLe: modifieLe(),
  },
  (t) => [unique("course_semaine_cle").on(t.semaineId, t.cle)],
);

// ---------------------------------------------------------------- activité

export const activite = pgEnum("activite", ["course", "pilates", "renfo", "velo", "autre"]);
export const creneau = pgEnum("creneau", ["matin", "midi", "soir"]);

export const seance = pgTable(
  "seance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    semaineId: uuid("semaine_id")
      .notNull()
      .references(() => semaine.id, { onDelete: "cascade" }),
    personneId: uuid("personne_id")
      .notNull()
      .references(() => personne.id, { onDelete: "cascade" }),
    activite: activite("activite").notNull(),
    // Obligatoire pour « autre », absent sinon.
    nomId: uuid("nom_id").references(() => nomConserve.id),
    jour: smallint("jour").notNull(),
    creneau: creneau("creneau").notNull(),
    faite: boolean("faite").notNull().default(false),
    creeLe: creeLe(),
    modifieLe: modifieLe(),
  },
  (t) => [
    check("seance_jour", sql`${t.jour} BETWEEN 1 AND 7`),
    check("seance_autre_nommee", sql`(${t.activite} = 'autre') = (${t.nomId} IS NOT NULL)`),
  ],
);

// ---------------------------------------------------------------- types

export type Foyer = typeof foyer.$inferSelect;
export type Personne = typeof personne.$inferSelect;
export type Semaine = typeof semaine.$inferSelect;
export type Mesure = typeof mesure.$inferSelect;
export type NomConserve = typeof nomConserve.$inferSelect;
export type Ecart = typeof ecart.$inferSelect;
export type Recette = typeof recette.$inferSelect;
export type Ingredient = typeof ingredient.$inferSelect;
export type PlatSemaine = typeof platSemaine.$inferSelect;
export type Seance = typeof seance.$inferSelect;
export type Course = typeof course.$inferSelect;
