ALTER TYPE "public"."usage_nom" ADD VALUE 'article';--> statement-breakpoint
CREATE TABLE "course" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"semaine_id" uuid NOT NULL,
	"cle" text NOT NULL,
	"nom_id" uuid,
	"cochee" boolean DEFAULT false NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"modifie_le" timestamp with time zone,
	CONSTRAINT "course_semaine_cle" UNIQUE("semaine_id","cle")
);
--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_semaine_id_semaine_id_fk" FOREIGN KEY ("semaine_id") REFERENCES "public"."semaine"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_nom_id_nom_conserve_id_fk" FOREIGN KEY ("nom_id") REFERENCES "public"."nom_conserve"("id") ON DELETE no action ON UPDATE no action;