#!/bin/sh
# Sauvegarde quotidienne de la base Postgres de Bien, sur l'hôte du VPS.
#
# `pg_dump` tourne dans le conteneur Postgres géré par Dokploy (le nom de la
# tâche Swarm change à chaque redéploiement, on le retrouve par son préfixe),
# le résultat compressé est écrit dans /var/backups/bien, 30 jours conservés.
# Le snapshot quotidien OVH du VPS reste le filet en cas de perte du serveur.
#
# Installation (une fois, en root) :
#   install -m 755 sauvegarde-db.sh /usr/local/bin/bien-sauvegarde-db
#   printf '%s\n' '15 3 * * * root /usr/local/bin/bien-sauvegarde-db' > /etc/cron.d/bien-sauvegarde-db
#
# Restauration d'un fichier dans une base (vide) :
#   gunzip -c bien-AAAAMMJJ.sql.gz | docker exec -i <conteneur> psql -U bien -d bien
set -eu
umask 077

SERVICE="bien-db-ewlapb"
DOSSIER="/var/backups/bien"
JOURS=30

conteneur="$(docker ps -q -f "name=${SERVICE}" | head -n 1)"
[ -n "$conteneur" ] || { echo "conteneur ${SERVICE} introuvable" >&2; exit 1; }

install -d -m 700 "$DOSSIER"
fichier="${DOSSIER}/bien-$(date -u +%Y%m%d-%H%M).sql.gz"
docker exec "$conteneur" pg_dump -U bien --clean --if-exists bien | gzip > "$fichier"
find "$DOSSIER" -name 'bien-*.sql.gz' -mtime +"$JOURS" -delete
echo "sauvegarde : $fichier ($(du -h "$fichier" | cut -f1))"
