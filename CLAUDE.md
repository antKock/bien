# CLAUDE.md — Bien

App de rituel du dimanche pour un foyer de deux personnes : préparer la semaine (mesures, jokers, plats, activité, liste de courses), puis la confirmer le dimanche suivant. Ce n'est pas une app de régime. Elle ne s'ouvre que le dimanche : aucune notification, aucune saisie entre deux dimanches.

## Où lire quoi

Les spécifications et maquettes viennent d'un vault privé et sont copiées dans `docs/`, **volontairement hors git** (données personnelles : ne jamais les commiter, ne jamais en recopier dans le code, les tests, les seeds ou ce fichier). Si `docs/` est absent, demander à l'utilisateur de le resynchroniser avant de travailler sur une phase.

Ordre de lecture avant tout travail :

1. `PLAN.md` — le plan par phases, agréé. Chaque phase se détaille à son démarrage, jamais avant.
2. `docs/design/README.md` puis `docs/design/20.regles-ux.md` — les six règles d'homogénéité. **Les réintroduire en double est le principal risque du développement.**
3. `docs/30.app-regles-metier.md` — modèle et règles de calcul.
4. `docs/design/30.ecrans.md`, `00.tokens.md`, `10.composants.md` au moment de coder ; `Bien - L'application.html` est la référence visuelle (21 écrans).

**Les maquettes font foi sur tout ce qui est visible.** `docs/archives/30.app.md` est l'ancien brief, périmé : ne pas s'en servir.

## Méthode

- **Chaque phase s'ouvre par une revue critique** des écrans et règles concernés : zones floues, flows non réfléchis, écarts maquette / règles, cas non dessinés. Le résultat est une liste de questions tranchées avec l'utilisateur, puis reportée dans `docs/` (côté vault) pour que les documents restent la référence. Les documents fournis sont une base complète, pas une vérité finale.
- **Les tableaux d'exemples du document de règles deviennent des tests** de `domain/`, relus ensemble avant l'UI.
- Chaque phase se termine par une revue sur téléphone, écran par écran contre la maquette, puis un dimanche d'usage réel.
- Un seul environnement déployé jusqu'à la mise en prod native.

## Stack et architecture

Next.js 16 (App Router, server components, server actions ; pas de couche API séparée hormis le lien Mijote), TypeScript, Tailwind 4 avec les tokens de `docs/design/bien-ds.css`, Drizzle + Postgres, session par cookie signé, Capacitor en coquille distante, image Docker standalone. **Pas de Supabase.** Hébergement sur le même VPS et le même Dokploy que Mijote.

Quatre couches, dépendances dans un seul sens :

```
src/
  domain/      règles pures, sans IO, testées — c'est ici que vivent les specs
  db/          schéma Drizzle, migrations, requêtes
  app/         routes (2 onglets + pile) et server actions, sans logique métier
  components/  ds/ (primitives de bien-ds.css) puis un dossier par sujet
  lib/         session, client Mijote, dates (la semaine commence le lundi)
```

**Un composant par règle d'UX, jamais deux façons de faire la même chose** : un écran de sujet, un écran d'ajout, une case à cocher, une feuille de nommage, une carte de semaine à quatre états, une grille de jokers. Avant de créer un composant, chercher lequel des six le couvre déjà.

L'utilisateur veut des apps techniquement simples, un maximum de réutilisation, le moins d'UX distinctes possible, et une architecture claire. En cas de doute, la solution la plus simple gagne.

## Règles produit non négociables

- Ton factuel, jamais moralisateur. Vocabulaire interdit : raté, manqué, échoué, oublié, félicitations, série, objectif atteint. Aucune série, aucun score, aucun message d'encouragement.
- Les états vides sont valides : aucun écran d'état vide illustré, aucun manque signalé.
- Le dépassement informe, ne bloque jamais. Aucun rouge dans l'app ; trois familles de couleur seulement (accent bleu-vert, ochre des jokers, terracotta du non prévu et du hors budget).
- Poids affiché en % du poids de départ, jamais en kilos côte à côte. Aucune comparaison entre les deux personnes.
- Pas d'écran Réglages, pas d'onboarding, pas de troisième onglet, pas de menu, pas de bouton flottant.
- Rien autour du déjeuner. Pas de comptage, pas de journal alimentaire.
- Jamais de théorie nutritionnelle ni de conseil médical.

## Foyers

Deux foyers créés par seed : le **réel**, utilisé chaque dimanche, et un foyer de **test** marqué visuellement, remis à zéro par script. Un code par foyer ; changer de foyer = ressaisir un code via un lien discret.

## Mijote

Mijote (dépôt local `../atable`) fournit titre, photo et lien des recettes d'un carnet ; tout le reste (portions, scalabilité, ingrédients) vit dans Bien. Côté Mijote, un carnet est un foyer ; il n'existe pas encore d'endpoint listant un carnet, il sera ajouté en phase 5. Mijote indisponible = seules les images manquent.

## Git

Branche `main`, dépôt public. Commits en français. Ne jamais ajouter `docs/` ni un fichier contenant des noms, poids ou mesures réels.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
