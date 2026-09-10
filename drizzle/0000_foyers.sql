CREATE TABLE "foyer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"code" text NOT NULL,
	"est_test" boolean DEFAULT false NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "foyer_slug_unique" UNIQUE("slug"),
	CONSTRAINT "foyer_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "personne" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"foyer_id" uuid NOT NULL,
	"prenom" text NOT NULL,
	"ordre" smallint NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "personne_foyer_ordre" UNIQUE("foyer_id","ordre")
);
--> statement-breakpoint
ALTER TABLE "personne" ADD CONSTRAINT "personne_foyer_id_foyer_id_fk" FOREIGN KEY ("foyer_id") REFERENCES "public"."foyer"("id") ON DELETE cascade ON UPDATE no action;