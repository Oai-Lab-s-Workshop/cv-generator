# Resumate

Resumate est un générateur de CV moderne pensé pour les profils qui ont des expériences variées, beaucoup de projets, de compétences ou de réalisations, et qui ne veulent ni repartir de zero pour chaque candidature ni envoyer un CV trop chargé. L'objectif est d'aider a centraliser toutes ses donnees professionnelles dans un seul endroit, puis a selectionner et mettre en avant les experiences, skills et elements de parcours les plus pertinents pour une offre d'emploi donnee.

L'idee n'est pas de produire un CV unique et fige, mais de composer rapidement plusieurs profils cibles a partir d'une base de donnees personnelle reutilisable. On evite ainsi de reecrire le meme contenu a chaque fois, tout en limitant le bruit: un recruteur voit surtout ce qui est utile pour le poste vise, au lieu d'un CV surcharge de donnees pas toujours pertinentes.

Le projet combine une interface d'administration Angular, un backend PocketBase et un serveur MCP pour permettre a la fois une gestion manuelle des contenus et une generation assistee de profils adaptes a un poste. L'objectif est de proposer une base simple a auto-heberger, extensible et orientee usage reel, aussi bien pour un usage personnel que pour une future offre hebergee.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Démarrage rapide](#démarrage-rapide)
- [Installation locale](#installation-locale)
- [Configuration](#configuration)
- [Développement](#développement)
- [MCP et intégration IA](#mcp-et-intégration-ia)
- [Données de démonstration](#données-de-démonstration)
- [Structure du projet](#structure-du-projet)
- [Mise en ligne prochaine](#mise-en-ligne-prochaine)
- [Roadmap](#roadmap)
- [Contribution](#contribution)
- [Licence](#licence)

## Fonctionnalités

- Gestion de profils CV avec nom, slug public, visibilité et template assigné
- Prévisualisation de plusieurs templates de CV
- Édition des relations d'un profil: expériences, projets, compétences, diplômes, hobbies et réalisations
- Publication de routes publiques pour partager un CV
- Export PDF via impression navigateur
- Authentification et administration via PocketBase
- Gestion de clés API dédiées au serveur MCP
- Création de profils CV ciblés à partir de données existantes via outils MCP
- Seed local optionnel pour charger un jeu de données de démonstration

## Architecture

- Frontend: Angular 21
- Backend: PocketBase
- Base de données: SQLite via PocketBase
- Serveur MCP: Spring Boot Java
- Orchestration locale: Docker Compose

Le frontend sert d'interface d'administration et de rendu public des CV. PocketBase stocke les utilisateurs, profils et données métier. Le service MCP expose des outils pour lister les matériaux d'un utilisateur, récupérer les templates disponibles et créer un profil CV public personnalisé à partir des données existantes.

## Stack technique

- Angular 21
- PocketBase
- Spring Boot
- Docker Compose
- Jest
- Bootstrap Icons
- `html2pdf.js`

## Prérequis

- Docker et Docker Compose
- Node.js 22+ si vous souhaitez lancer le frontend hors conteneur
- Java si vous souhaitez travailler directement sur le service MCP hors Docker
- `make` pour utiliser les commandes de confort du dépôt

## Démarrage rapide

L'option la plus simple pour lancer la stack complète:

```bash
docker compose up -d
```

Services disponibles ensuite:

- Frontend: `http://localhost:4200`
- PocketBase Admin: `http://localhost:8090/_/`
- API PocketBase: `http://localhost:8090/api/`
- MCP: `http://localhost:8081/mcp`

Compte administrateur créé automatiquement au démarrage:

- Email: `admin@cv-generator.local`
- Mot de passe: `changeme123!`

Vous pouvez remplacer ces valeurs via les variables d'environnement `PB_ADMIN_EMAIL` et `PB_ADMIN_PASSWORD`.

## Installation locale

### 1. Préparer l'environnement

Créez un fichier `.env` à partir de l'exemple si nécessaire:

```bash
cp .env.example .env
```

### 2. Lancer la stack

Avec Docker Compose:

```bash
docker compose up -d
```

Ou avec les commandes `make` du projet:

```bash
make up
```

Pour initialiser aussi le compte de service MCP et redemarrer le service avec les credentials resolus:

```bash
make bootstrap
```

### 3. Vérifier les services

- Frontend: `http://localhost:4200`
- PocketBase Admin: `http://localhost:8090/_/`
- PocketBase API: `http://localhost:8090/api/health`

## Configuration

Variables principales disponibles dans `.env`:

```env
PB_ADMIN_EMAIL=admin@cv-generator.local
PB_ADMIN_PASSWORD=changeme123!
FRONTEND_BASE_URL=http://localhost:4200
POCKETBASE_SERVICE_USER_EMAIL=
POCKETBASE_SERVICE_USER_PASSWORD=
RESUMATE_AI_TOKEN=
```

Description rapide:

- `PB_ADMIN_EMAIL`: email du super administrateur PocketBase
- `PB_ADMIN_PASSWORD`: mot de passe du super administrateur PocketBase
- `FRONTEND_BASE_URL`: URL publique du frontend, utilisée notamment par le MCP
- `POCKETBASE_SERVICE_USER_EMAIL`: compte de service utilisé par le serveur MCP
- `POCKETBASE_SERVICE_USER_PASSWORD`: mot de passe du compte de service MCP
- `RESUMATE_AI_TOKEN`: jeton éventuel utilisé dans certains flux d'intégration

## Développement

### Commandes utiles

```bash
make env-init
make up
make down
make logs
make ps
make wait-pocketbase
make bootstrap
make bootstrap-with-seed
make mcp-up
make mcp-down
make mcp-logs
make ensure-mcp-service-user
make seed
make clean-seed
```

Comportement principal:

- `make env-init`: cree le fichier `.env` a partir de `.env.example` s'il n'existe pas
- `make up`: démarre la stack Docker
- `make wait-pocketbase`: attend que PocketBase reponde sur son endpoint de sante
- `make bootstrap`: initialise l'environnement, attend PocketBase, crée ou met à jour l'utilisateur de service MCP, puis démarre le service MCP
- `make bootstrap-with-seed`: exécute le bootstrap complet puis importe les données de démonstration
- `make seed`: importe les données de démo si les collections cibles sont vides
- `make clean-seed`: supprime uniquement les données de démonstration

### Philosophie frontend

Le projet cherche a garder des composants partages visuellement propres et reutilisables, plutot que de les limiter a une structure HTML brute sans style.

Dans les templates CV, l'objectif est que la page de template garde la main sur la direction visuelle globale, y compris quand elle compose des composants issus de `shared/components/`.

Pour cela, une page de template peut volontairement utiliser `ViewEncapsulation.None` lorsque le template doit faire descendre son systeme de styles jusqu'aux composants enfants et harmoniser l'ensemble du rendu. Ce choix est surtout utile pour les templates tres diriges visuellement, ou la page agit comme couche de composition et de direction artistique plus que comme simple conteneur.

En pratique:

- les composants partages doivent rester presentables par defaut et suffisamment autonomes pour etre reutilises
- les pages de template peuvent reprendre la main sur le rendu final quand un template a besoin d'une identite visuelle forte
- `ViewEncapsulation.None` n'est pas une regle absolue pour toutes les pages, mais un outil assume pour les templates qui doivent styliser finement leur sous-arbre

### Frontend

Le frontend Angular est situé dans `frontend/`.

Structure principale sous `frontend/src/app/`:

- `pages/`: pages de route chargees via `app.routes.ts` (`login`, `home`, `profile-editor`, `template-gallery`, `cv-shell`, templates CV, etc.)
- `core/`: briques metier partagees entre pages, notamment les `services`, `guards`, `models`, `utils`, donnees de preview et registre des templates
- `shared/components/`: composants UI reutilisables entre plusieurs templates ou ecrans, par exemple `project-chip`, `education-chip`, `icon-label-data` ou `card-project`

#### Shared Components

Le dossier `shared/components/` contient les blocs de presentation reutilisables qui evitent de dupliquer le markup ou le style dans chaque template CV. Les templates importent directement ces composants standalone selon leurs besoins.

Exemples actuels:

- `ClassicCvPage` reutilise `ProjectChip`, `AchievementChip`, `EducationChip` et `ProfileSummaryChip`
- `SupaCVPage` reutilise `IconLabelData`, `EducationChip` et `CardProject`

L'idee est de garder dans chaque page de template la composition et la logique propres au rendu, tout en deplacant dans `shared/components/` les elements visuels repetables.

#### Template Registry

Le fichier `frontend/src/app/core/templates/cv-template-registry.ts` est le point central qui declare les templates disponibles:

- chaque entree expose un `id`, un `label` et le composant Angular a rendre
- `CV_TEMPLATE_OPTIONS` alimente les listes de choix dans `HomePage`, `ProfileEditorPage` et `TemplateGalleryPage`
- `CV_TEMPLATE_OPTIONS_BY_ID` permet a `CvShellPage` de resoudre dynamiquement le composant a afficher pour un profil donne

Le flux est donc le suivant:

1. un profil CV stocke un identifiant de template comme `classic`, `modern`, `supa` ou `minimal`
2. les ecrans d'administration lisent le registre pour proposer uniquement les templates connus
3. la route publique `/:slug` charge `CvShellPage`, qui recupere le profil puis selectionne le composant correspondant depuis le registre

Pour ajouter un nouveau template, il faut en pratique:

1. creer une nouvelle page dans `pages/templates/`
2. ajouter l'entree correspondante dans `cv-template-registry.ts`
3. reutiliser des composants `shared/components/` existants si possible, ou y extraire de nouveaux blocs si le template introduit des morceaux partageables

Scripts disponibles:

```bash
cd frontend
npm install
npm start
npm run build
npm test
```

Le serveur de développement Angular proxy les requêtes `/api` vers PocketBase afin de conserver un mode de fonctionnement proche de la production.

### Dev Container

Le dépôt inclut une configuration devcontainer/Codespaces orientée Docker. Elle permet de:

- démarrer automatiquement la stack complète
- attendre la disponibilité de PocketBase et du frontend
- exposer les ports `4200` et `8090`
- conserver les données PocketBase dans un dossier privé au workspace

Si vous devez relancer l'initialisation dans le conteneur:

```bash
bash .devcontainer/setup.sh
```

## MCP et intégration IA

Le dépôt inclut un serveur MCP local qui permet à un agent compatible de travailler sur les données CV d'un utilisateur sans exposer directement ses identifiants PocketBase.

Le service MCP permet notamment de:

- identifier l'utilisateur lié à une clé API MCP
- lister les templates disponibles
- récupérer les matériaux réutilisables d'un profil: expériences, projets, compétences, diplômes, hobbies, réalisations
- créer un profil CV public personnalisé pour une offre donnée

### Première configuration locale du MCP

```bash
make bootstrap
```

Equivalent detaille si vous souhaitez executer les etapes separement:

```bash
make up
make ensure-mcp-service-user
make mcp-up
```

Ensuite:

1. Connectez-vous à l'application avec le compte propriétaire des données CV.
2. Ouvrez la page de gestion des tokens MCP.
3. Créez une clé API MCP.
4. Injectez cette clé dans votre configuration locale d'agent si nécessaire.

Le fichier `opencode.json` du projet pointe déjà vers l'endpoint local `http://localhost:8081/mcp`.

## Données de démonstration

Pour charger un jeu de données de preview:

```bash
make bootstrap-with-seed
```

Ou plus tard:

```bash
make seed
```

Le chargement est volontairement strict et échoue si les collections cibles ne sont pas vides.

Pour supprimer uniquement les données de démonstration:

```bash
make clean-seed
```

## Structure du projet

```text
.
├── frontend/                 # Application Angular
├── mcp/                      # Serveur MCP Spring Boot
├── pb_migrations/            # Migrations PocketBase
├── pb_hooks/                 # Hooks PocketBase
├── pb_data/                  # Données locales PocketBase
├── scripts/                  # Scripts utilitaires et import seed
├── .devcontainer/            # Environnement Codespaces/devcontainer
├── docker-compose.yml        # Stack locale principale
├── docker-compose.devcontainer.yml
├── Makefile                  # Commandes de confort
└── opencode.json             # Configuration MCP locale pour OpenCode
```

## Mise en ligne prochaine

Une mise en ligne publique du projet est prévue prochainement.

Le positionnement visé est le suivant:

- une version gratuite self-hosted, destinée aux développeurs et utilisateurs souhaitant héberger eux-mêmes la solution
- une version payante hébergée, destinée à ceux qui veulent une solution prête à l'emploi, administrée et accessible sans gestion d'infrastructure

À ce stade, le dépôt correspond à la base technique du produit et au mode d'exécution local. Les détails de l'offre hébergée, du déploiement public et du packaging commercial sont encore en cours de finalisation.

## Roadmap

Axes de travail visibles ou probables à court terme:

- amélioration continue des templates de CV (ajout du support web pour les templates print-first et print pour les web-first)
- enrichissement de l'éditeur de profil
- stabilisation des flux MCP et des permissions associées
- préparation de la distribution self-hosted
- préparation de l'offre hébergée payante


## Licence

Aucune licence explicite n'est actuellement définie dans ce dépôt.

Avant toute réutilisation, distribution ou exploitation commerciale, il est recommandé d'ajouter une licence formelle adaptée au modèle souhaité pour la version self-hosted et la future offre hébergée.
