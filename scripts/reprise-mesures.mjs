// Reprise des mesures notées avant l'app, à lancer une fois. Lit un CSV local,
// jamais commité : une ligne par dimanche et par personne,
//   dimanche,prenom,poids,tour_taille      (tour de taille facultatif)
//   2026-08-30,Anthony,95.0,96
// Crée les semaines correspondantes (celle que le dimanche ouvre), clôturées,
// et pose les mesures ; rejouable, une valeur existante est écrasée.
//   dev  : node --env-file=.env scripts/reprise-mesures.mjs reel mesures.csv
//   prod : docker cp mesures.csv <conteneur>:/tmp/ && docker exec <conteneur> node scripts/reprise-mesures.mjs reel /tmp/mesures.csv
import { readFileSync } from "node:fs";
import { Pool } from "pg";

const [slug, fichier] = process.argv.slice(2);
if (!["reel", "test"].includes(slug) || !fichier) {
  console.error("usage : reprise-mesures.mjs <reel|test> <fichier.csv>");
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquante");
  process.exit(1);
}

const lignes = readFileSync(fichier, "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#") && !l.startsWith("dimanche"))
  .map((l) => {
    const [dimanche, prenom, poids, taille] = l.split(",").map((x) => x.trim());
    const d = new Date(`${dimanche}T12:00:00Z`);
    if (Number.isNaN(d.getTime()) || d.getUTCDay() !== 0) throw new Error(`Pas un dimanche : ${dimanche}`);
    const lundi = new Date(d.getTime() + 86_400_000).toISOString().slice(0, 10);
    return { dimanche, lundi, prenom, poids: Number(poids.replace(",", ".")), taille: taille ? Number(taille) : null };
  });

const pool = new Pool({ connectionString: url, max: 1 });
const client = await pool.connect();
try {
  const { rows: foyers } = await client.query("SELECT id FROM foyer WHERE slug = $1", [slug]);
  if (!foyers[0]) throw new Error(`Foyer ${slug} absent : lancer le seed d'abord`);
  const foyerId = foyers[0].id;
  const { rows: personnes } = await client.query("SELECT id, prenom FROM personne WHERE foyer_id = $1", [foyerId]);

  await client.query("BEGIN");
  for (const l of lignes) {
    const personne = personnes.find((p) => p.prenom.toLowerCase() === l.prenom.toLowerCase());
    if (!personne) throw new Error(`Prénom inconnu dans le foyer ${slug} : ${l.prenom}`);
    // La semaine est clôturée le dimanche qui la termine, à midi Paris : la reprise est un acte manuel.
    const cloture = new Date(new Date(`${l.lundi}T12:00:00Z`).getTime() + 6 * 86_400_000);
    const { rows } = await client.query(
      `INSERT INTO semaine (foyer_id, debut, cloturee_le) VALUES ($1, $2, $3)
       ON CONFLICT (foyer_id, debut) DO UPDATE SET cloturee_le = COALESCE(semaine.cloturee_le, EXCLUDED.cloturee_le)
       RETURNING id`,
      [foyerId, l.lundi, cloture],
    );
    const semaineId = rows[0].id;
    const mesures = [["poids", l.poids], ...(l.taille === null ? [] : [["tour_taille", l.taille]])];
    for (const [type, valeur] of mesures) {
      if (!Number.isFinite(valeur)) throw new Error(`Valeur invalide : ${l.dimanche} ${l.prenom} ${type}`);
      await client.query(
        `INSERT INTO mesure (semaine_id, personne_id, type, valeur) VALUES ($1, $2, $3, $4)
         ON CONFLICT (semaine_id, personne_id, type) DO UPDATE SET valeur = EXCLUDED.valeur, modifie_le = now()`,
        [semaineId, personne.id, type, valeur],
      );
    }
    console.log(`${l.dimanche} ${l.prenom} : ${l.poids} kg${l.taille === null ? "" : ` · ${l.taille} cm`}`);
  }
  await client.query("COMMIT");
  console.log(`${lignes.length} ligne(s) reprises`);
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
