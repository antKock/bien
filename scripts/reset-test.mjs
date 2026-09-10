// Remet le foyer de test à zéro : efface tout ce qui lui est rattaché, sauf le
// foyer lui-même et ses deux personnes. À compléter à chaque table ajoutée
// (une ligne par table portant un foyer_id, dans l'ordre des dépendances).
//   dev  : npm run db:reset-test
//   prod : docker exec <conteneur> node scripts/reset-test.mjs
import { Pool } from "pg";

const TABLES_PAR_FOYER = [
  // phase 1 : "mesure", "joker", "autre_nomme", "plat_de_la_semaine", "plat_libre", "seance", "semaine"
];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquante");
  process.exit(1);
}
const pool = new Pool({ connectionString: url, max: 1 });
const client = await pool.connect();
try {
  const { rows } = await client.query("SELECT id FROM foyer WHERE slug = 'test'");
  if (rows.length === 0) {
    console.error("Foyer de test absent : lancer le seed d'abord");
    process.exit(1);
  }
  const foyerId = rows[0].id;
  await client.query("BEGIN");
  for (const table of TABLES_PAR_FOYER) {
    const r = await client.query(`DELETE FROM ${table} WHERE foyer_id = $1`, [foyerId]);
    console.log(`${table} : ${r.rowCount} lignes effacées`);
  }
  await client.query("COMMIT");
  console.log("Foyer de test remis à zéro");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
