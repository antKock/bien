CREATE TYPE "public"."activite" AS ENUM('course', 'pilates', 'renfo', 'velo', 'autre');--> statement-breakpoint
CREATE TYPE "public"."creneau" AS ENUM('matin', 'midi', 'soir');--> statement-breakpoint
CREATE TYPE "public"."duree_recette" AS ENUM('express', 'rapide', 'long');--> statement-breakpoint
CREATE TYPE "public"."rayon" AS ENUM('primeur', 'boucher', 'poissonnier', 'cremerie', 'epicerie', 'surgeles', 'epices_base');--> statement-breakpoint
CREATE TYPE "public"."scalabilite" AS ENUM('continu', 'par_lot');--> statement-breakpoint
CREATE TYPE "public"."type_ecart" AS ENUM('apero_riche', 'alcool', 'repas_riche', 'extra_sucre', 'autre');--> statement-breakpoint
CREATE TYPE "public"."type_mesure" AS ENUM('poids', 'tour_taille');--> statement-breakpoint
CREATE TYPE "public"."usage_nom" AS ENUM('autre', 'plat_libre', 'activite');--> statement-breakpoint
CREATE TABLE "ecart" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"semaine_id" uuid NOT NULL,
	"jour" smallint NOT NULL,
	"type" "type_ecart" NOT NULL,
	"nom_id" uuid,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp with time zone,
	"retire_le" timestamp with time zone,
	CONSTRAINT "ecart_semaine_jour_type" UNIQUE("semaine_id","jour","type"),
	CONSTRAINT "ecart_jour" CHECK ("ecart"."jour" BETWEEN 1 AND 7),
	CONSTRAINT "ecart_autre_nomme" CHECK (("ecart"."type" = 'autre') = ("ecart"."nom_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "ingredient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recette_id" uuid NOT NULL,
	"nom" text NOT NULL,
	"quantite" numeric(8, 2),
	"unite" text,
	"rayon" "rayon" NOT NULL,
	"ordre" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mesure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"semaine_id" uuid NOT NULL,
	"personne_id" uuid NOT NULL,
	"type" "type_mesure" NOT NULL,
	"valeur" numeric(5, 1) NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp with time zone,
	CONSTRAINT "mesure_semaine_personne_type" UNIQUE("semaine_id","personne_id","type")
);
--> statement-breakpoint
CREATE TABLE "nom_conserve" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"foyer_id" uuid NOT NULL,
	"usage" "usage_nom" NOT NULL,
	"libelle" text NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plat_semaine" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"semaine_id" uuid NOT NULL,
	"recette_id" uuid,
	"nom_id" uuid,
	"repas" smallint DEFAULT 1 NOT NULL,
	"repas_cuisines" smallint DEFAULT 0 NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp with time zone,
	CONSTRAINT "plat_semaine_recette" UNIQUE("semaine_id","recette_id"),
	CONSTRAINT "plat_semaine_nom" UNIQUE("semaine_id","nom_id"),
	CONSTRAINT "plat_semaine_source" CHECK (("plat_semaine"."recette_id" IS NULL) <> ("plat_semaine"."nom_id" IS NULL)),
	CONSTRAINT "plat_semaine_repas" CHECK ("plat_semaine"."repas" BETWEEN 1 AND 4 AND "plat_semaine"."repas_cuisines" BETWEEN 0 AND "plat_semaine"."repas")
);
--> statement-breakpoint
CREATE TABLE "recette" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" text NOT NULL,
	"duree" "duree_recette" NOT NULL,
	"portions_par_lot" smallint NOT NULL,
	"scalabilite" "scalabilite" NOT NULL,
	"mijote_id" text,
	"image_url" text,
	"lien_url" text,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recette_mijote_id_unique" UNIQUE("mijote_id")
);
--> statement-breakpoint
CREATE TABLE "seance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"semaine_id" uuid NOT NULL,
	"personne_id" uuid NOT NULL,
	"activite" "activite" NOT NULL,
	"nom_id" uuid,
	"jour" smallint NOT NULL,
	"creneau" "creneau" NOT NULL,
	"faite" boolean DEFAULT false NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp with time zone,
	CONSTRAINT "seance_jour" CHECK ("seance"."jour" BETWEEN 1 AND 7),
	CONSTRAINT "seance_autre_nommee" CHECK (("seance"."activite" = 'autre') = ("seance"."nom_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "semaine" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"foyer_id" uuid NOT NULL,
	"debut" date NOT NULL,
	"validee_le" timestamp with time zone,
	"cloturee_le" timestamp with time zone,
	"rouverte_le" timestamp with time zone[] DEFAULT '{}' NOT NULL,
	"jokers_valides_le" timestamp with time zone,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "semaine_foyer_debut" UNIQUE("foyer_id","debut")
);
--> statement-breakpoint
ALTER TABLE "ecart" ADD CONSTRAINT "ecart_semaine_id_semaine_id_fk" FOREIGN KEY ("semaine_id") REFERENCES "public"."semaine"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecart" ADD CONSTRAINT "ecart_nom_id_nom_conserve_id_fk" FOREIGN KEY ("nom_id") REFERENCES "public"."nom_conserve"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredient" ADD CONSTRAINT "ingredient_recette_id_recette_id_fk" FOREIGN KEY ("recette_id") REFERENCES "public"."recette"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mesure" ADD CONSTRAINT "mesure_semaine_id_semaine_id_fk" FOREIGN KEY ("semaine_id") REFERENCES "public"."semaine"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mesure" ADD CONSTRAINT "mesure_personne_id_personne_id_fk" FOREIGN KEY ("personne_id") REFERENCES "public"."personne"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nom_conserve" ADD CONSTRAINT "nom_conserve_foyer_id_foyer_id_fk" FOREIGN KEY ("foyer_id") REFERENCES "public"."foyer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plat_semaine" ADD CONSTRAINT "plat_semaine_semaine_id_semaine_id_fk" FOREIGN KEY ("semaine_id") REFERENCES "public"."semaine"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plat_semaine" ADD CONSTRAINT "plat_semaine_recette_id_recette_id_fk" FOREIGN KEY ("recette_id") REFERENCES "public"."recette"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plat_semaine" ADD CONSTRAINT "plat_semaine_nom_id_nom_conserve_id_fk" FOREIGN KEY ("nom_id") REFERENCES "public"."nom_conserve"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seance" ADD CONSTRAINT "seance_semaine_id_semaine_id_fk" FOREIGN KEY ("semaine_id") REFERENCES "public"."semaine"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seance" ADD CONSTRAINT "seance_personne_id_personne_id_fk" FOREIGN KEY ("personne_id") REFERENCES "public"."personne"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seance" ADD CONSTRAINT "seance_nom_id_nom_conserve_id_fk" FOREIGN KEY ("nom_id") REFERENCES "public"."nom_conserve"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semaine" ADD CONSTRAINT "semaine_foyer_id_foyer_id_fk" FOREIGN KEY ("foyer_id") REFERENCES "public"."foyer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "nom_conserve_unique" ON "nom_conserve" USING btree ("foyer_id","usage",lower("libelle"));