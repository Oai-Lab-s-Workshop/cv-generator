# Resumate

Resumate est une application de gestion et de génération de CV ciblés. L'objectif n'est pas de produire un CV unique et figé, mais de centraliser les éléments d'un parcours professionnel dans une base personnelle réutilisable, puis de composer rapidement un profil adapté à une offre, un client, un contexte de mission ou une cible métier.

Le produit s'adresse surtout aux profils qui accumulent beaucoup d'expériences, projets, compétences, diplômes, réalisations ou activités, et qui veulent éviter deux problèmes classiques : réécrire le même contenu à chaque candidature, ou envoyer un CV trop dense où les éléments importants sont noyés.

Resumate combine aujourd'hui une interface web Angular, un backend PocketBase, un serveur MCP Spring Boot et une couche de packaging desktop en cours de stabilisation. Le projet sert à la fois de base technique de développement, de socle pour une version hébergée managée et de fondation pour une distribution locale via application bundlée.

## État actuel

Resumate est actuellement en bêta fermée.

La version hébergée est disponible à l'adresse suivante :

```text
https://resumate.oai-lab.dev/
```

Cette instance n'est pas ouverte au public. Les inscriptions libres ne sont pas disponibles pour le moment et seuls des utilisateurs sélectionnés peuvent disposer d'un compte.

Le dépôt contient encore la base de développement actuelle, notamment la stack Docker, les migrations PocketBase, le frontend, le serveur MCP et les scripts de bootstrap. À terme, après l'intégration du paywall Stripe et la stabilisation de l'offre commerciale, le code source pourra passer en privé ou ce dépôt pourra rester public sous forme d'archive.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Modes d'utilisation](#modes-dutilisation)
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
- [Pricing futur](#pricing-futur)
- [Roadmap](#roadmap)
- [Licence](#licence)

## Fonctionnalités

Resumate est construit autour d'une idée simple : séparer les matériaux de carrière du CV final.

- Gestion centralisée des expériences, projets, compétences, diplômes, hobbies et réalisations
- Création de profils CV à partir d'une sélection de matériaux existants
- Association d'un template visuel à chaque profil
- Gestion d'un slug public et d'une visibilité par profil
- Rendu public d'un CV via une route partageable
- Prévisualisation de plusieurs templates de CV
- Export PDF via l'impression navigateur
- Authentification et gestion des comptes via PocketBase
- Gestion de clés API MCP propres à chaque utilisateur
- Création assistée de profils ciblés par un agent compatible MCP
- Jeu de données de démonstration pour tester la stack localement

## Modes d'utilisation

### Version hébergée

La version hébergée correspond à l'expérience produit managée : l'utilisateur accède à Resumate depuis le web, sans installer PocketBase, Docker, Java ou le serveur MCP.

Statut actuel : bêta fermée.

- URL : `https://resumate.oai-lab.dev/`
- Accès : comptes réservés à des utilisateurs sélectionnés
- Inscriptions publiques : non disponibles pour le moment
- Objectif : stabiliser le produit, les templates, les flux de génération et les permissions avant une ouverture plus large

Cette version a vocation à devenir l'offre principale pour les utilisateurs qui veulent une solution prête à l'emploi, maintenue et disponible sans gestion d'infrastructure.

### Usage local et self-hosted

Le dépôt permet aujourd'hui de lancer une stack locale avec Docker Compose. Ce mode est utile pour développer, tester, itérer sur les templates et valider les intégrations.

L'objectif self-hosted côté produit n'est pas de promettre une distribution gratuite et ouverte du code source. La direction prévue est plutôt une application locale bundlée, capable d'embarquer les briques nécessaires pour exécuter Resumate sur la machine de l'utilisateur avec un minimum de configuration.

En pratique, la trajectoire locale est :

- stack Docker pour le développement et les tests techniques actuels
- packaging desktop en cours via Electrobun
- bundling de PocketBase, du frontend, du serveur MCP et d'un runtime Java adapté
- données locales conservées dans l'environnement utilisateur, pas dans les ressources applicatives

### Stack de développement

Le mode de développement actuel expose trois services principaux :

- frontend Angular pour l'interface privée et le rendu public des CV
- PocketBase pour l'authentification, les données métier, les fichiers et les règles d'accès
- serveur MCP Spring Boot pour les intégrations IA et la création de profils ciblés à partir des données existantes

## Architecture

Resumate est organisé autour de quatre couches.

### Frontend Angular

Le frontend sert à la fois d'interface d'administration et de moteur de rendu des CV publics.

Il couvre notamment :

- la connexion utilisateur
- la page d'accueil des profils
- l'éditeur de profil CV
- la gestion des matériaux de carrière
- la galerie de templates
- la gestion des tokens MCP
- les pages publiques de CV accessibles par slug
- les écrans dédiés au futur usage desktop

Les templates disponibles sont déclarés dans `frontend/src/app/core/templates/cv-template-registry.ts`. Les templates actuels incluent `classic`, `bento`, `modern`, `supa` et `minimal`.

### Backend PocketBase

PocketBase fournit le socle backend :

- authentification
- collections métier
- relations entre profils, expériences, projets, compétences, diplômes, hobbies et réalisations
- stockage SQLite
- migrations et hooks
- règles d'accès pour les données privées et les CV publics

### Serveur MCP Spring Boot

Le serveur MCP expose des outils utilisables par un agent compatible afin de travailler sur les données CV sans manipuler directement les identifiants PocketBase de l'utilisateur.

Il permet notamment de :

- résoudre l'utilisateur associé à une clé API MCP
- lister les templates disponibles
- lister les matériaux réutilisables du profil
- créer un profil CV ciblé pour une offre ou un rôle donné

### Packaging desktop

Le dossier `desktop/` prépare une application locale basée sur Electrobun.

Cette couche vise à empaqueter :

- le frontend Angular buildé
- le serveur MCP Java
- un runtime Java minimal
- PocketBase
- les ressources nécessaires à une exécution locale

Ce mode est encore en cours de stabilisation et s'inscrit dans la trajectoire self-hosted via application bundlée.

## Stack technique

- Angular 21
- PocketBase
- SQLite via PocketBase
- Spring Boot 4
- Spring AI MCP Server
- Java 17
- Docker Compose
- Electrobun
- Bun
- Jest
- Bootstrap Icons
- Masonry / ngx-masonry
- Quill / ngx-quill

## Prérequis

- Docker et Docker Compose pour lancer la stack complète localement
- Node.js 22+ ou Bun si vous travaillez directement sur le frontend
- Java 17+ si vous travaillez directement sur le serveur MCP ou le packaging desktop
- `make` pour utiliser les commandes de confort du dépôt

## Démarrage rapide

L'option la plus simple pour lancer la stack complète :

```bash
docker compose up -d
```

Services disponibles ensuite :

- Frontend : `${FRONTEND_BASE_URL}` avec `http://localhost:${FRONTEND_PORT:-4200}` par défaut
- PocketBase Admin : `${PB_URL}/_/` avec `http://localhost:${POCKETBASE_PORT:-8090}/_/` par défaut
- API PocketBase : `${PB_URL}/api/` avec `http://localhost:${POCKETBASE_PORT:-8090}/api/` par défaut
- MCP : `${MCP_BASE_URL}/mcp` avec `http://localhost:${MCP_PORT:-8081}/mcp` par défaut

Ces ports correspondent aux valeurs par défaut. Vous pouvez les remplacer dans `.env` avec `FRONTEND_PORT`, `POCKETBASE_PORT` et `MCP_PORT`.

Compte administrateur créé automatiquement au démarrage :

- Email : `admin@cv-generator.local`
- Mot de passe : `changeme123!`

Vous pouvez remplacer ces valeurs via les variables d'environnement `PB_ADMIN_EMAIL` et `PB_ADMIN_PASSWORD`.

## Installation locale

### 1. Préparer l'environnement

Créez un fichier `.env` à partir de l'exemple si nécessaire :

```bash
cp .env.example .env
```

### 2. Lancer la stack

Avec Docker Compose :

```bash
docker compose up -d
```

Ou avec les commandes `make` du projet :

```bash
make up
```

Pour initialiser aussi le compte de service MCP et redémarrer le service avec les credentials résolus :

```bash
make bootstrap
```

### 3. Vérifier les services

- Frontend : `${FRONTEND_BASE_URL}`
- PocketBase Admin : `${PB_URL}/_/`
- PocketBase API : `${PB_URL}/api/health`
- MCP : `${MCP_BASE_URL}/mcp`

Si vous avez modifié les ports exposés dans `.env`, utilisez les ports configurés à la place des valeurs par défaut ci-dessus.

## Configuration

Variables principales disponibles dans `.env` :

```env
PB_ADMIN_EMAIL=admin@cv-generator.local
PB_ADMIN_PASSWORD=changeme123!
POCKETBASE_PORT=8090
POCKETBASE_INTERNAL_PORT=8090
MCP_PORT=8081
MCP_INTERNAL_PORT=8081
FRONTEND_PORT=4200
FRONTEND_INTERNAL_PORT=4200
FRONTEND_BASE_URL=http://localhost:${FRONTEND_PORT:-4200}
PB_URL=http://localhost:${POCKETBASE_PORT:-8090}
POCKETBASE_BASE_URL=http://pocketbase:${POCKETBASE_INTERNAL_PORT:-8090}
MCP_BASE_URL=http://localhost:${MCP_PORT:-8081}
POCKETBASE_SERVICE_USER_EMAIL=
POCKETBASE_SERVICE_USER_PASSWORD=
RESUMATE_AI_TOKEN=
```

Description rapide :

- `PB_ADMIN_EMAIL` : email du super administrateur PocketBase
- `PB_ADMIN_PASSWORD` : mot de passe du super administrateur PocketBase
- `POCKETBASE_PORT` : port hôte exposé pour PocketBase
- `POCKETBASE_INTERNAL_PORT` : port interne écouté par PocketBase dans Docker
- `MCP_PORT` : port hôte exposé pour le serveur MCP
- `MCP_INTERNAL_PORT` : port interne écouté par le serveur MCP dans Docker
- `FRONTEND_PORT` : port hôte exposé pour le frontend Angular
- `FRONTEND_INTERNAL_PORT` : port interne écouté par le serveur Angular dans Docker
- `FRONTEND_BASE_URL` : URL publique du frontend, utilisée notamment par le MCP
- `PB_URL` : URL PocketBase côté hôte, utilisée par les scripts locaux
- `POCKETBASE_BASE_URL` : URL PocketBase côté réseau Docker, utilisée par le MCP et le proxy frontend
- `MCP_BASE_URL` : URL MCP côté hôte
- `POCKETBASE_SERVICE_USER_EMAIL` : compte de service utilisé par le serveur MCP
- `POCKETBASE_SERVICE_USER_PASSWORD` : mot de passe du compte de service MCP
- `RESUMATE_AI_TOKEN` : jeton éventuel utilisé dans certains flux d'intégration

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

Comportement principal :

- `make env-init` : crée le fichier `.env` à partir de `.env.example` s'il n'existe pas
- `make up` : démarre la stack Docker
- `make wait-pocketbase` : attend que PocketBase réponde sur son endpoint de santé
- `make bootstrap` : initialise l'environnement, attend PocketBase, crée ou met à jour l'utilisateur de service MCP, puis démarre le service MCP
- `make bootstrap-with-seed` : exécute le bootstrap complet puis importe les données de démonstration
- `make seed` : importe les données de démonstration si les collections cibles sont vides
- `make clean-seed` : supprime uniquement les données de démonstration

### Frontend

Le frontend Angular est situé dans `frontend/`.

Structure principale sous `frontend/src/app/` :

- `pages/` : pages de route chargées via `app.routes.ts`
- `core/` : services, guards, modèles, utilitaires, données de preview et registre des templates
- `shared/components/` : composants UI réutilisables entre plusieurs templates ou écrans

Scripts disponibles :

```bash
cd frontend
npm install
npm start
npm run build
npm test
```

Le serveur de développement Angular proxy les requêtes `/api` vers PocketBase afin de conserver un mode de fonctionnement proche de la production.

### Templates CV

Le fichier `frontend/src/app/core/templates/cv-template-registry.ts` est le point central qui déclare les templates disponibles :

- chaque entrée expose un `id`, un `label` et le composant Angular à rendre
- `CV_TEMPLATE_OPTIONS` alimente les listes de choix dans les écrans d'administration
- `CV_TEMPLATE_OPTIONS_BY_ID` permet à `CvShellPage` de résoudre dynamiquement le composant à afficher pour un profil donné

Le flux est le suivant :

1. Un profil CV stocke un identifiant de template comme `classic`, `bento`, `modern`, `supa` ou `minimal`.
2. Les écrans d'administration lisent le registre pour proposer uniquement les templates connus.
3. La route publique `/:slug` charge `CvShellPage`, qui récupère le profil puis sélectionne le composant correspondant depuis le registre.

Pour ajouter un nouveau template :

1. Créer une nouvelle page dans `pages/templates/`.
2. Ajouter l'entrée correspondante dans `cv-template-registry.ts`.
3. Réutiliser des composants `shared/components/` existants si possible.

### Desktop

Le dossier `desktop/` contient le travail de packaging local.

Commandes principales :

```bash
bun run desktop:prepare
bun run desktop:dev
bun run desktop:build
bun run desktop:build:stable
bun run test:desktop
```

La préparation desktop construit le frontend, package le serveur MCP, prépare un runtime Java et récupère PocketBase pour la plateforme cible.

### Dev Container

Le dépôt inclut une configuration devcontainer/Codespaces orientée Docker. Elle permet de :

- démarrer automatiquement la stack complète
- attendre la disponibilité de PocketBase et du frontend
- exposer les ports définis par `FRONTEND_PORT`, `POCKETBASE_PORT` et `MCP_PORT`
- conserver les données PocketBase dans un dossier privé au workspace

Si vous devez relancer l'initialisation dans le conteneur :

```bash
bash .devcontainer/setup.sh
```

## MCP et intégration IA

Le dépôt inclut un serveur MCP local qui permet à un agent compatible de travailler sur les données CV d'un utilisateur sans exposer directement ses identifiants PocketBase.

Le service MCP permet notamment de :

- identifier l'utilisateur lié à une clé API MCP
- lister les templates disponibles
- récupérer les matériaux réutilisables d'un profil : expériences, projets, compétences, diplômes, hobbies, réalisations
- créer un profil CV public personnalisé pour une offre donnée

### Première configuration locale du MCP

```bash
make bootstrap
```

Équivalent détaillé si vous souhaitez exécuter les étapes séparément :

```bash
make up
make ensure-mcp-service-user
make mcp-up
```

Ensuite :

1. Connectez-vous à l'application avec le compte propriétaire des données CV.
2. Ouvrez la page de gestion des tokens MCP.
3. Créez une clé API MCP.
4. Injectez cette clé dans votre configuration locale d'agent si nécessaire.

Le fichier `opencode.json` du projet pointe vers l'endpoint MCP local par défaut. Si vous changez `MCP_PORT`, adaptez aussi cette URL dans votre configuration d'agent locale ou utilisez `${MCP_BASE_URL}/mcp` comme valeur cible.

## Données de démonstration

Pour charger un jeu de données de preview :

```bash
make bootstrap-with-seed
```

Ou plus tard :

```bash
make seed
```

Le chargement est volontairement strict et échoue si les collections cibles ne sont pas vides.

Pour supprimer uniquement les données de démonstration :

```bash
make clean-seed
```

## Structure du projet

```text
.
├── frontend/                 # Application Angular
├── desktop/                  # Packaging local Electrobun
├── mcp/                      # Serveur MCP Spring Boot
├── pb_migrations/            # Migrations PocketBase
├── pb_hooks/                 # Hooks PocketBase
├── pb_data/                  # Données locales PocketBase
├── scripts/                  # Scripts utilitaires et import seed
├── .devcontainer/            # Environnement Codespaces/devcontainer
├── docker-compose.yml        # Stack locale principale
├── Makefile                  # Commandes de confort
└── opencode.json             # Configuration MCP locale pour OpenCode
```

## Pricing futur

Le pricing n'est pas encore public et aucun tarif définitif n'est annoncé à ce stade.

La direction produit actuelle est la suivante :

- une offre hébergée payante, pensée pour les utilisateurs qui veulent Resumate prêt à l'emploi, maintenu et accessible depuis le web
- une distribution locale via application bundlée, pour exécuter Resumate sur sa propre machine sans assembler manuellement toute la stack
- une intégration Stripe à venir pour gérer le paywall, les accès et la transition vers l'offre commerciale

Après cette étape, le code source pourra devenir privé ou ce dépôt pourra rester public uniquement comme archive de la phase initiale du projet.

## Roadmap

Axes de travail prioritaires :

- stabiliser la bêta fermée hébergée sur `https://resumate.oai-lab.dev/`
- améliorer les règles d'accès, la séparation des données utilisateurs et les permissions MCP
- finaliser les flux de création de profils ciblés via MCP
- intégrer Stripe et formaliser le paywall
- stabiliser le packaging local via application bundlée
- améliorer la qualité visuelle et fonctionnelle des templates CV
- enrichir l'éditeur de matériaux de carrière et l'éditeur de profils
- clarifier la stratégie de distribution du code source après la phase bêta
- préparer une ouverture plus large une fois le produit, le pricing et l'infrastructure stabilisés

## Licence

Aucune licence explicite n'est actuellement définie dans ce dépôt.

Avant toute réutilisation, distribution ou exploitation commerciale, il est recommandé d'ajouter une licence formelle adaptée au modèle retenu pour la version hébergée, la distribution locale et l'avenir du dépôt source.
