// Répertoire de démarrage : cinq recettes de test, communes aux deux foyers,
// qui couvrent les cas des règles (continu, par lot, un sauveur). Idempotent :
// une recette est retrouvée par son nom, ses ingrédients sont réécrits.
// Titres, photos et liens viendront de Mijote (phase 5).
//   dev  : npm run db:seed-recettes
//   prod : docker exec <conteneur> node scripts/seed-recettes.mjs
import { Pool } from "pg";

const P = "primeur", B = "boucher", C = "cremerie", E = "epicerie", S = "surgeles", X = "epices_base";
const ing = (nom, quantite, unite, rayon) => ({ nom, quantite, unite, rayon });
const base = (nom) => ({ nom, quantite: null, unite: null, rayon: X });

const RECETTES = [
  {
    nom: "Chili con carne", duree: "express", portionsParLot: 4, scalabilite: "continu",
    ingredients: [
      ing("Bœuf haché 5 %", 750, "g", B), ing("Poivrons rouges", 2, "pièce", P), ing("Oignons", 1, "pièce", P),
      ing("Haricots rouges", 2, "boîte", E), ing("Tomates concassées", 1, "boîte", E),
      base("Paprika fumé"), base("Cumin"), base("Huile d'olive"),
    ],
  },
  {
    nom: "Quiche poireaux-chèvre", duree: "rapide", portionsParLot: 4, scalabilite: "par_lot",
    ingredients: [
      ing("Poireaux", 4, "pièce", P), ing("Bûche de chèvre", 2, "pièce", C), ing("Œufs", 6, "pièce", C),
      ing("Pâte brisée", 1, "pièce", C), ing("Crème fraîche", 20, "cl", C), base("Huile d'olive"), base("Muscade"),
    ],
  },
  {
    nom: "Tajine de poulet", duree: "long", portionsParLot: 4, scalabilite: "continu",
    ingredients: [
      ing("Cuisses de poulet", 4, "pièce", B), ing("Carottes", 3, "pièce", P), ing("Courgettes", 2, "pièce", P),
      ing("Poivrons rouges", 2, "pièce", P), ing("Oignons", 2, "pièce", P), ing("Semoule complète", 300, "g", E),
      base("Ras el-hanout"), base("Huile d'olive"),
    ],
  },
  {
    nom: "Soupe de légumes d'hiver", duree: "rapide", portionsParLot: 6, scalabilite: "continu",
    ingredients: [
      ing("Carottes", 600, "g", P), ing("Poireaux", 2, "pièce", P), ing("Pommes de terre", 400, "g", P),
      ing("Oignons", 1, "pièce", P), base("Bouillon de légumes"), base("Huile d'olive"),
    ],
  },
  {
    nom: "Poêlée de légumes et œufs", duree: "express", portionsParLot: 2, scalabilite: "continu",
    ingredients: [
      ing("Poêlée de légumes surgelée", 600, "g", S), ing("Œufs", 4, "pièce", C), ing("Riz express", 250, "g", E),
      base("Huile d'olive"),
    ],
  },
];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquante");
  process.exit(1);
}
const pool = new Pool({ connectionString: url, max: 1 });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const r of RECETTES) {
    const { rows } = await client.query("SELECT id FROM recette WHERE nom = $1", [r.nom]);
    let id = rows[0]?.id;
    if (id) {
      await client.query(
        "UPDATE recette SET duree = $2, portions_par_lot = $3, scalabilite = $4 WHERE id = $1",
        [id, r.duree, r.portionsParLot, r.scalabilite],
      );
      await client.query("DELETE FROM ingredient WHERE recette_id = $1", [id]);
    } else {
      const ins = await client.query(
        "INSERT INTO recette (nom, duree, portions_par_lot, scalabilite) VALUES ($1, $2, $3, $4) RETURNING id",
        [r.nom, r.duree, r.portionsParLot, r.scalabilite],
      );
      id = ins.rows[0].id;
    }
    for (const [i, g] of r.ingredients.entries()) {
      await client.query(
        "INSERT INTO ingredient (recette_id, nom, quantite, unite, rayon, ordre) VALUES ($1, $2, $3, $4, $5, $6)",
        [id, g.nom, g.quantite, g.unite, g.rayon, i],
      );
    }
    console.log(`${r.nom} : ${r.ingredients.length} ingrédients`);
  }
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
