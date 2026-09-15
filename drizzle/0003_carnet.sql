ALTER TABLE "recette" ADD COLUMN "dans_carnet" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "recette" ADD COLUMN "mijote_maj_le" timestamp with time zone;