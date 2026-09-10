# Image de production de Bien : Next.js en sortie standalone, migrations
# appliquées au démarrage du conteneur (scripts/migrate.mjs), puis server.js.
#
#   docker build --build-arg GIT_COMMIT_SHA=$(git rev-parse HEAD) -t bien .
#   docker run -e DATABASE_URL=… -e SESSION_SIGNING_SECRET=… -p 3000:3000 bien
#
# Aucun secret ne passe en build-arg : le dépôt est public et les couches de
# l'image sont lisibles. Tout se lit à l'exécution. Node épinglé sur une
# version précise de la LTS, à monter à la main.

# ---------- deps ----------
FROM node:24.21.0-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- build ----------
FROM node:24.21.0-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG GIT_COMMIT_SHA
ENV GIT_COMMIT_SHA=$GIT_COMMIT_SHA \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- runner ----------
FROM node:24.21.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Sortie standalone : server.js + node_modules tracés (dont drizzle-orm et pg,
# que le script de migration réutilise). `.next/static` et `public/` sont à
# copier à côté. `drizzle/` porte les migrations, `scripts/` les outils d'exploitation.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=build --chown=nextjs:nodejs /app/scripts ./scripts

USER nextjs
EXPOSE 3000

# /api/version est force-dynamic et sans dépendance externe : sonde idéale.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/version >/dev/null 2>&1 || exit 1

CMD ["sh", "-c", "node scripts/migrate.mjs && exec node server.js"]
