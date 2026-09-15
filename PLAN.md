# Bien — plan de construction

*Brouillon du 8 septembre 2026, à amender. Chaque phase est détaillée à son démarrage ; seul le cap est fixé ici.*

Références : `docs/design/README.md` (les 21 écrans font foi), `docs/design/20.regles-ux.md` (les six règles), `docs/30.app-regles-metier.md` (modèle et calculs).

---

## Les partis pris

**Stack.** Next.js 16 (App Router, server components, server actions — pas de couche API séparée hormis le lien Mijote), TypeScript, Tailwind 4 avec les tokens de `bien-ds.css`, Drizzle + Postgres (conteneur Dokploy sur le VPS OVH), session par cookie signé (module repris de Mijote), Capacitor en coquille distante (pattern Mijote), image Docker standalone poussée par GitHub Actions.

**Architecture en quatre couches, dépendances dans un seul sens.**

```
src/
  domain/      règles pures, sans IO : coût joker, lots, agrégation, cycle de semaine, tendance %
               → c'est ici que vivent les specs, sous forme de tests
  db/          schéma Drizzle, migrations, requêtes
  app/         routes (2 onglets + pile), server actions, pas de logique métier
  components/  ds/ (primitives de bien-ds.css) puis un dossier par sujet
  lib/         session, client Mijote, dates (une semaine commence le lundi)
```

**Réutilisation : un composant par règle d'UX, jamais deux façons de faire la même chose.** Les six règles du design sont la carte de la réutilisation :

| Règle | Un seul composant | Sert à |
|---|---|---|
| Écran de sujet | `SujetScreen` (chevron, titre, liste, bouton ghost) | Mesures, Jokers, Plats, Activité, Courses |
| Ajouter | `AjoutScreen` + CTA « Ajouter à la semaine » | Plat, séance — en préparation comme en confirmation |
| Confirmer / sélectionner | `Case` | Plats, séances, répertoire, courses |
| Nommer | `SheetNommage` (champ, déjà notés, CTA) | « autre » des jokers, plat libre |
| Progresser | `WeekCard` avec ses quatre états | Accueil, en cours, confirmation, clôturée |
| Grille | `GrilleJokers` | Poser d'avance (semaine à venir) et confirmer (semaine écoulée) |

**Un seul environnement déployé** jusqu'à la mise en prod native, utilisé pour de vrai chaque dimanche dès la phase 2. Le rituel réel est le banc de validation : chaque phase ajoute un sujet au dimanche suivant, dans l'esprit « un changement à la fois » du programme.

**Validation des specs à trois niveaux.**

1. **Revue critique en ouverture de chaque phase.** Avant d'écrire une ligne, analyse des écrans et des règles concernés : zones floues, flows non réfléchis (retour, annulation, cas limites, ordre des gestes), manquements entre maquette et règles métier, cas non dessinés. Le résultat est une liste de questions tranchées ensemble, puis reportée dans les documents de `docs/` pour qu'ils restent la référence. Le dossier fourni est une base complète ; il se revalide morceau par morceau, pas d'un bloc.
2. **Les tableaux d'exemples du document de règles deviennent des tests du domaine**, lisibles et revus ensemble avant l'UI.
3. **Chaque phase se termine par une revue sur téléphone**, écran par écran contre la maquette, et un dimanche d'usage réel sur le foyer réel.

**Deux foyers dès le socle.** Un foyer réel, utilisé chaque dimanche, et un foyer de test pour essayer sans polluer les données. Chacun a son code ; changer de foyer, c'est ressaisir un code, via un lien discret (pas d'écran Réglages). Le foyer de test est marqué visuellement pour ne jamais être confondu, et un script le remet à zéro.

---

## Phase 0 — Socle ✔ terminée le 10 septembre 2026

*Décisions et écarts : `docs/32.decisions-dev.md`. En résumé : Node 24 et npm 11 partout ; migrations appliquées au démarrage du conteneur par un script `pg` pur ; redirections relatives, aucune origine à configurer ; sauvegarde de la base par cron `pg_dump` sur le VPS plutôt que par Dokploy (qui exige un S3) ; DNS à créer avant le domaine Dokploy. Déployé sur `bien.anthonykocken.fr`.*

**Objectif :** une app vide, déployée, avec l'écran de code foyer, et une base de code dont l'arborescence ne bougera plus.

- Init Next 16 + TS + Tailwind 4, tokens et polices (Fraunces, Inter, DM Mono) depuis `bien-ds.css`, primitives `components/ds/` calées sur `10.composants.md`.
- Drizzle + Postgres : conteneur Dokploy, migrations, sauvegarde.
- Session + écran 01 (code foyer). Seed de **deux foyers** (réel et test), deux personnes chacun, un code par foyer ; lien discret de changement de foyer ; marqueur visuel sur le foyer de test ; script de remise à zéro du foyer de test.
- Revue critique de l'écran 01 et de l'entrée dans l'app : où placer le lien de changement de foyer sans créer d'écran Réglages, que faire d'un code faux, durée de session.
- Dockerfile, CI (lint, tests, build, image), sous-domaine + Traefik, déploiement automatique.
- Squelette de navigation : deux onglets Semaines / Tendances, vides.

**Sortie :** l'écran 01 s'ouvre sur le domaine, un code mène à une page vide, la CI est verte.

## Phase 1 — Modèle et règles ✔ terminée le 12 septembre 2026

*Décisions et écarts : `docs/32.decisions-dev.md`. En résumé : le dimanche clôt sa semaine et prépare la suivante ; l'état d'une semaine se déduit de ses horodatages, sans colonne `statut` ; validation acquise le lundi minuit, clôture toujours manuelle ; une seule règle prévu / non prévu pour les trois sujets ; l'écart est l'entité des jokers, retiré et non supprimé après validation ; geste « Valider » sur la grille des jokers ; une seule table de noms conservés ; `modifie_le` simple au lieu de `modifie_le[]`. Document de règles passé en v3, 100 tests de domaine.*

**Objectif :** figer le modèle et prouver les calculs avant tout écran.

- Revue critique du document de règles : contradictions internes, cas limites non couverts (semaine rouverte puis reclôturée, joker posé d'avance puis décoché, plat ×0, mesure corrigée), horodatage de la trace.
- Schéma complet : Semaine, Mesure, Joker, AutreNomme, Recette, Ingredient, PlatDeLaSemaine, PlatLibre, Seance, avec la trace (`cree_le`, `modifie_le[]`).
- `domain/` : coût d'une soirée (½ / 1 plafond), budget et dépassement, prévu / improvisé, cycle de semaine (valider, clôturer, rouvrir), `non_prevu`, lots et scalabilité, agrégation par rayon, tendance en % du départ.
- Tests écrits directement depuis les tableaux d'exemples du document de règles.

**Sortie :** revue des cas de test ensemble — c'est la validation des specs. Tout écart trouvé corrige le document de règles, pas seulement le code.

## Phase 2 — La semaine, Mesures et Activité ✔ livrée le 12 septembre 2026

*Décisions et écarts : `docs/32.decisions-dev.md`. En résumé : onglet composé par le domaine (semaine à confirmer en carte pleine, courante, fantôme le dimanche, passées réduites et dépliables, les vides comprises) ; la validation est le pivot entre formulaire de préparation et de confirmation ; feuille de nommage construite dès cette phase pour l'activité « autre » ; script de reprise des mesures créant des semaines clôturées ; `BIEN_AUJOURDHUI` pour rejouer un dimanche en développement. Revue sur téléphone et premier dimanche réel reportés, à faire d'ici la phase 6 (décision d'Anthony du 15 septembre 2026).*

**Objectif :** le cycle complet du dimanche tourne, avec les deux sujets les plus simples, et tous les patterns d'écran existent.

- Revue critique des écrans 02, 03, 09 à 13, 19, 20 : transitions entre états de la carte, ce qui se passe quand on ouvre l'app un mardi, retour depuis un écran d'ajout, semaine à suivre quand la courante n'est pas validée.
- `WeekCard` et ses quatre états, semaine à suivre fantôme, semaines passées, valider / clôturer / rouvrir (écrans 02, 11, 12, 13, 20).
- Mesures (03) : `SujetScreen`, champ inline sans bouton, historique.
- Activité (09, 10, 19) : première instance d'`AjoutScreen` avec pastilles de sélection, `Case` de confirmation, mention « non prévu », croix de retrait en préparation seulement.

**Sortie :** revue contre les maquettes ; premier dimanche réel avec pesée et séances. Reprise des mesures notées depuis le 1er septembre.

## Phase 3 — Jokers ✔ livrée le 15 septembre 2026

*Décisions et écarts : `docs/32.decisions-dev.md`. En résumé : une seule grille pour poser et confirmer, chaque coche enregistrée à l'instant avec affichage optimiste, jauge calculée côté client sur les mêmes règles que le domaine, lien « Valider » en confirmation, feuille de nommage pour « autre », sous-titres comptés en jetons. L'horloge de développement (`BIEN_AUJOURDHUI`) décale désormais aussi les horodatages. Revue sur téléphone reportée avec celle de la phase 2.*

**Objectif :** la mécanique centrale, identique en pose et en confirmation.

- Revue critique des écrans 04, 14 à 17 : grille de la semaine à venir vs écoulée sur un même composant, décocher un « autre » nommé, jauge quand la semaine n'est pas encore confirmée.
- `GrilleJokers` 7 × 5 avec coût calculé à la volée, jauge de jetons (posé, consommé, demi, libre, au-delà).
- `SheetNommage` pour « autre », noms conservés et reproposés.
- Écrans 04, 14, 15, 16, 17.

**Sortie :** plafond et dépassement vérifiés sur téléphone ; un dimanche réel avec la grille de la semaine écoulée.

## Phase 4 — Plats et liste de courses ✔ livrée le 15 septembre 2026

*Décisions et écarts : `docs/32.decisions-dev.md`. En résumé : la liste est toujours recalculée, seules les coches (« réglé ») et les articles ajoutés à la main sont stockés (table `course`) ; « − » à ×1 retire un plat ; les plats déjà retenus n'apparaissent pas dans l'ajout ; la feuille « Plat libre » ajoute tout d'un coup ; panier accessible dans tous les états non clôturés ; quantités comptables arrondies au supérieur ; cinq recettes de test seedées par `scripts/seed-recettes.mjs`. Revue sur téléphone reportée avec les phases 2 et 3.*

**Objectif :** le cœur du produit selon le brief, construit sur les patterns déjà stables.

- Revue critique des écrans 05 à 08 et 18 : article ajouté à la main et sa persistance, plat retiré après courses faites, plat libre dans la liste de courses, coche de la liste entre deux dimanches.
- Répertoire seedé dans Bien (5 recettes tests couvrant `continu`, `par_lot`, un sauveur), images en placeholder.
- Plats (05) avec stepper du nombre de repas ; Ajouter un plat (06) en réutilisant `AjoutScreen` + `Case` ; plat libre (07) en réutilisant `SheetNommage` ; confirmation (18).
- Liste de courses (08) : lots invisibles à la préparation, visibles ici ; onglets par rayon / par plat ; rayon « Épices & base » ; article ajouté à la main. Nomenclature d'ingrédients minimale pour l'agrégation, dette assumée.

**Sortie :** la liste de courses reproduit les cas du §2 (quiche ×3 = 2 lots, chili ×1,5) ; un dimanche réel avec plats et courses.

## Phase 5 — Lien Mijote ✔ livrée le 15 septembre 2026

*Décisions et écarts : `docs/32.decisions-dev.md`. En résumé : **le répertoire, c'est le carnet Mijote** (code membre `MIJOTE_CARNET`), relu à l'ouverture de « Ajouter un plat » ; durée, portions, scalabilité et ingrédients avec rayon sont déduits du texte Mijote par `domain/mijote` (dictionnaire de rayons, dette de nomenclature assumée) ; route `GET /api/carnets/<code>/recettes` côté Mijote à secret partagé ; photos et liens publics stockés, Mijote injoignable = dernière version connue.*

**Objectif :** titres, photos et liens viennent du carnet Mijote ; tout le reste reste dans Bien.

- Côté Mijote : une route qui liste les recettes d'un carnet (titre, photo, lien public), protégée par jeton.
- Côté Bien : `lib/mijote`, rafraîchissement périodique, `mijote_id` sur Recette, comportement dégradé si Mijote est indisponible (seule l'image manque).
- Passage du répertoire réel (`20.repertoire-plats.md`) dans le carnet, puis complément des données Bien par recette.

**Sortie :** les vignettes de l'écran 06 sont les photos Mijote ; Mijote coupé, l'app tourne.

## Phase 6 — Tendances ✔ livrée le 15 septembre 2026

*Décisions et écarts : `docs/32.decisions-dev.md`. En résumé : courbe sur toutes les mesures avec un départ par personne, tableau des quatre dernières dates, jokers et activité sur huit semaines ; une personne sous trois mesures n'a pas de courbe, aucune carte vide n'est rendue ; SVG à la main, géométrie testée dans `domain/tendances`. Revue avec les données réelles reportée avec celle des phases 2 à 4.*

**Objectif :** le seul écran qui regarde au-delà d'une semaine.

- Revue critique de l'écran 21 : point de départ du % quand les premières pesées manquent, semaine sans mesure sur la courbe, lecture avec un seul des deux qui se pèse.
- Courbes SVG à la main, en % du poids de départ, deux personnes sur le même graphe ; onglets Poids / Tour de taille.
- Tableau des mesures, carte Jokers (posés vs consommés, fréquence des cinq catégories), activité par personne.
- Moins de trois pesées = vide, sans message.

**Sortie :** revue contre l'écran 21 avec les données réelles accumulées.

## Phase 7 — Apps natives et mise en prod

**Objectif :** Bien sur les deux téléphones, au propre.

- Capacitor iOS et Android en coquille distante, page offline, splash, icône et nom définitifs.
- Sauvegardes vérifiées par une restauration, surveillance minimale, décision staging ou non.
- Passe finale de conformité : ton, vocabulaire interdit, aucune couleur hors palette, aucun état vide illustré.

**Sortie :** installation sur les deux téléphones, un dimanche complet sans passer par le navigateur.

---

## Ce qui reste ouvert

- Nommage définitif de l'app et icône (phase 7).
- Position de la case à cocher (à gauche partout ou non) : trancher en phase 2, avant qu'elle soit reprise partout.
- Nomenclature des ingrédients : version minimale en phase 4, à enrichir à l'usage.
