// Crée ou met à jour les deux foyers : le réel et le test. Idempotent.
// Les codes et les prénoms viennent de l'environnement (voir .env.example) :
// rien de personnel n'entre dans le dépôt.
//   dev  : npm run db:seed
//   prod : docker exec <conteneur> node scripts/seed.mjs
import { Pool } from "pg";

function lire(nom) {
  const v = process.env[nom]?.trim();
  if (!v) {
    console.error(`${nom} manquante`);
    process.exit(1);
  }
  return v;
}

function code(nom) {
  const c = lire(nom).toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(c)) {
    console.error(`${nom} doit faire six caractères A-Z 0-9`);
    process.exit(1);
  }
  return c;
}

function personnes(nom) {
  const liste = lire(nom).split(",").map((p) => p.trim()).filter(Boolean);
  if (liste.length !== 2) {
    console.error(`${nom} doit contenir deux prénoms séparés par une virgule`);
    process.exit(1);
  }
  return liste;
}

const foyers = [
  { slug: "reel", estTest: false, code: code("FOYER_REEL_CODE"), personnes: personnes("FOYER_REEL_PERSONNES") },
  { slug: "test", estTest: true, code: code("FOYER_TEST_CODE"), personnes: personnes("FOYER_TEST_PERSONNES") },
];

const pool = new Pool({ connectionString: lire("DATABASE_URL"), max: 1 });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const f of foyers) {
    const { rows } = await client.query(
      `INSERT INTO foyer (slug, code, est_test) VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO UPDATE SET code = EXCLUDED.code, est_test = EXCLUDED.est_test
       RETURNING id`,
      [f.slug, f.code, f.estTest],
    );
    const foyerId = rows[0].id;
    for (const [i, prenom] of f.personnes.entries()) {
      await client.query(
        `INSERT INTO personne (foyer_id, prenom, ordre) VALUES ($1, $2, $3)
         ON CONFLICT (foyer_id, ordre) DO UPDATE SET prenom = EXCLUDED.prenom`,
        [foyerId, prenom, i + 1],
      );
    }
    console.log(`foyer ${f.slug} : code ${f.code}, ${f.personnes.length} personnes`);
  }
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
