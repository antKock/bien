// Applique les migrations de `drizzle/` (générées par drizzle-kit). Tourne avant
// le serveur dans l'image Docker (CMD du Dockerfile) et en dev : `npm run db:migrate`.
//
// Réécrit avec `pg` seul, sans le migrateur de drizzle-orm : l'image standalone
// n'embarque que les fichiers que l'app importe. Même table de suivi que
// drizzle-kit (`drizzle.__drizzle_migrations`), même règle : une entrée du
// journal est appliquée si son horodatage dépasse celui de la dernière posée.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";

const DOSSIER = "drizzle";
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquante");
  process.exit(1);
}

const journal = JSON.parse(await readFile(`${DOSSIER}/meta/_journal.json`, "utf8"));
const pool = new Pool({ connectionString: url, max: 1 });
const client = await pool.connect();
try {
  await client.query("CREATE SCHEMA IF NOT EXISTS drizzle");
  await client.query(
    `CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
       id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)`,
  );
  const { rows } = await client.query(
    "SELECT created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 1",
  );
  const derniere = rows[0] ? Number(rows[0].created_at) : 0;

  let appliquees = 0;
  await client.query("BEGIN");
  for (const entree of journal.entries) {
    if (entree.when <= derniere) continue;
    const sql = await readFile(`${DOSSIER}/${entree.tag}.sql`, "utf8");
    for (const instruction of sql.split("--> statement-breakpoint")) {
      if (instruction.trim()) await client.query(instruction);
    }
    await client.query("INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)", [
      createHash("sha256").update(sql).digest("hex"),
      entree.when,
    ]);
    console.log(`migration ${entree.tag} appliquée`);
    appliquees++;
  }
  await client.query("COMMIT");
  console.log(appliquees ? `${appliquees} migration(s) appliquée(s)` : "Base à jour");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
