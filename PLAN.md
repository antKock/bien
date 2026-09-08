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

## Phase 0 — Socle

**Objectif :** une app vide, déployée, avec l'écran de code foyer, et une base de code dont l'arborescence ne bougera plus.

- Init Next 16 + TS + Tailwind 4, tokens et polices (Fraunces, Inter, DM Mono) depuis `bien-ds.css`, primitives `components/ds/` calées sur `10.composants.md`.
- Drizzle + Postgres : conteneur Dokploy, migrations, sauvegarde.
- Session + écran 01 (code foyer). Seed de **deux foyers** (réel et test), deux personnes chacun, un code par foyer ; lien discret de changement de foyer ; marqueur visuel sur le foyer de test ; script de remise à zéro du foyer de test.
- Revue critique de l'écran 01 et de l'entrée dans l'app : où placer le lien de changement de foyer sans créer d'écran Réglages, que faire d'un code faux, durée de session.
- Dockerfile, CI (lint, tests, build, image), sous-domaine + Traefik, déploiement automatique.
- Squelette de navigation : deux onglets Semaines / Tendances, vides.

**Sortie :** l'écran 01 s'ouvre sur le domaine, un code mène à une page vide, la CI est verte.

## Phase 1 — Modèle et règles

**Objectif :** figer le modèle et prouver les calculs avant tout écran.

- Revue critique du document de règles : contradictions internes, cas limites non couverts (semaine rouverte puis reclôturée, joker posé d'avance puis décoché, plat ×0, mesure corrigée), horodatage de la trace.
- Schéma complet : Semaine, Mesure, Joker, AutreNomme, Recette, Ingredient, PlatDeLaSemaine, PlatLibre, Seance, avec la trace (`cree_le`, `modifie_le[]`).
- `domain/` : coût d'une soirée (½ / 1 plafond), budget et dépassement, prévu / improvisé, cycle de semaine (valider, clôturer, rouvrir), `non_prevu`, lots et scalabilité, agrégation par rayon, tendance en % du départ.
- Tests écrits directement depuis les tableaux d'exemples du document de règles.

**Sortie :** revue des cas de test ensemble — c'est la validation des specs. Tout écart trouvé corrige le document de règles, pas seulement le code.

## Phase 2 — La semaine, Mesures et Activité

**Objectif :** le cycle complet du dimanche tourne, avec les deux sujets les plus simples, et tous les patterns d'écran existent.

- Revue critique des écrans 02, 03, 09 à 13, 19, 20 : transitions entre états de la carte, ce qui se passe quand on ouvre l'app un mardi, retour depuis un écran d'ajout, semaine à suivre quand la courante n'est pas validée.
- `WeekCard` et ses quatre états, semaine à suivre fantôme, semaines passées, valider / clôturer / rouvrir (écrans 02, 11, 12, 13, 20).
- Mesures (03) : `SujetScreen`, champ inline sans bouton, historique.
- Activité (09, 10, 19) : première instance d'`AjoutScreen` avec pastilles de sélection, `Case` de confirmation, mention « non prévu », croix de retrait en préparation seulement.

**Sortie :** revue contre les maquettes ; premier dimanche réel avec pesée et séances. Reprise des mesures notées depuis le 1er septembre.

## Phase 3 — Jokers

**Objectif :** la mécanique centrale, identique en pose et en confirmation.

- Revue critique des écrans 04, 14 à 17 : grille de la semaine à venir vs écoulée sur un même composant, décocher un « autre » nommé, jauge quand la semaine n'est pas encore confirmée.
- `GrilleJokers` 7 × 5 avec coût calculé à la volée, jauge de jetons (posé, consommé, demi, libre, au-delà).
- `SheetNommage` pour « autre », noms conservés et reproposés.
- Écrans 04, 14, 15, 16, 17.

**Sortie :** plafond et dépassement vérifiés sur téléphone ; un dimanche réel avec la grille de la semaine écoulée.

## Phase 4 — Plats et liste de courses

**Objectif :** le cœur du produit selon le brief, construit sur les patterns déjà stables.

- Revue critique des écrans 05 à 08 et 18 : article ajouté à la main et sa persistance, plat retiré après courses faites, plat libre dans la liste de courses, coche de la liste entre deux dimanches.
- Répertoire seedé dans Bien (5 recettes tests couvrant `continu`, `par_lot`, un sauveur), images en placeholder.
- Plats (05) avec stepper du nombre de repas ; Ajouter un plat (06) en réutilisant `AjoutScreen` + `Case` ; plat libre (07) en réutilisant `SheetNommage` ; confirmation (18).
- Liste de courses (08) : lots invisibles à la préparation, visibles ici ; onglets par rayon / par plat ; rayon « Épices & base » ; article ajouté à la main. Nomenclature d'ingrédients minimale pour l'agrégation, dette assumée.

**Sortie :** la liste de courses reproduit les cas du §2 (quiche ×3 = 2 lots, chili ×1,5) ; un dimanche réel avec plats et courses.

## Phase 5 — Lien Mijote

**Objectif :** titres, photos et liens viennent du carnet Mijote ; tout le reste reste dans Bien.

- Côté Mijote : une route qui liste les recettes d'un carnet (titre, photo, lien public), protégée par jeton.
- Côté Bien : `lib/mijote`, rafraîchissement périodique, `mijote_id` sur Recette, comportement dégradé si Mijote est indisponible (seule l'image manque).
- Passage du répertoire réel (`20.repertoire-plats.md`) dans le carnet, puis complément des données Bien par recette.

**Sortie :** les vignettes de l'écran 06 sont les photos Mijote ; Mijote coupé, l'app tourne.

## Phase 6 — Tendances

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
