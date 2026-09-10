import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Une seule connexion par processus. En dev, Next recharge les modules à chaud :
// le pool est accroché à globalThis pour ne pas en ouvrir un par rechargement.

type Db = NodePgDatabase<typeof schema>;
const g = globalThis as unknown as { __bienDb?: Db };

export function db(): Db {
  if (!g.__bienDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL manquante");
    g.__bienDb = drizzle(new Pool({ connectionString: url, max: 5 }), { schema });
  }
  return g.__bienDb;
}

export { schema };
