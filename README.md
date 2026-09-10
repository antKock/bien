# Bien

App de rituel du dimanche pour un foyer : préparer la semaine (mesures, jokers, plats, activité, liste de courses), puis la confirmer le dimanche suivant.

Le plan de construction est dans [PLAN.md](PLAN.md). Les spécifications et maquettes vivent dans un vault privé et sont copiées localement dans `docs/`, volontairement hors git.

## Développer

Node 24, Docker (ou Colima) pour Postgres.

```sh
docker run -d --name bien-db -p 5433:5432 \
  -e POSTGRES_USER=bien -e POSTGRES_PASSWORD=bien -e POSTGRES_DB=bien postgres:17-alpine
cp .env.example .env        # puis renseigner secret, codes et prénoms
npm install
npm run db:migrate           # applique drizzle/
npm run db:seed              # crée les foyers réel et test depuis .env
npm run dev
```

- `npm test` — tests du domaine et de `lib/` (vitest).
- `npm run lint`, `npm run typecheck`.
- `npm run db:generate` — nouvelle migration après un changement de `src/db/schema.ts`.
- `npm run db:reset-test` — remet le foyer de test à zéro.

## Déployer

Chaque push sur `main` construit l'image (`Dockerfile`), la publie sur GHCR et demande à Dokploy de la tirer (`.github/workflows/deploy.yml`). Le conteneur applique les migrations au démarrage. Le seed s'exécute à la main dans le conteneur : `node scripts/seed.mjs`.
