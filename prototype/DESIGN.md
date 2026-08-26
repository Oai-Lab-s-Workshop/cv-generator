---
version: "3.0"
name: Affiche Harness
supersedes: "Affiche v2.0 — kit tokens.css / kit.css, conservé dans archives/"
description: "Système de la console Resumate tel qu'il est réellement construit dans prototype/. Console graphite sombre par défaut, papier d'affiche en thème clair, un champ lumineux directionnel par écran, grain masqué par sa propre lumière, et une grammaire Bauhaus complète : triade rouge / jaune / bleu en arrêts francs, formes élémentaires, keylines graduées. Angles francs, aucune ombre floue, trame de 96 px."
implementation:
  css: final.css
  js: final.js
  screens: 6 + lanceur
  themes: "sombre (défaut) · clair (data-theme='light')"

typography:
  titre: "'Archivo', 'Helvetica Neue', system-ui, sans-serif"
  corps: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"
  mono: "'IBM Plex Mono', ui-monospace, Menlo, monospace"
  body: "14px / 1.5, tabular-nums"
  display: "700 clamp(48px, 8vw, 112px) / .86, font-stretch 125%, letter-spacing -.045em, uppercase"
  display-medium: "clamp(42px, 6vw, 78px)"
  h2: "700 clamp(24px, 3vw, 40px) / 1, letter-spacing -.025em"
  h3: "700 16px / 1.2"
  lede: "clamp(15px, 1.6vw, 18px), max 62ch"
  eyebrow: "600 10px / 1.2 mono, letter-spacing .16em, uppercase"
  label: "600 10px / 1.2 mono, letter-spacing .08em, uppercase"

layout:
  page: 1280px
  gouttiere: "clamp(16px, 3vw, 36px)"
  case: 96px
  case-mobile: 76px
  cerne: 1px
  cible: 44px
  espacement: [4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px]
  rayon: "0 partout ; 50% uniquement sur un vrai cercle ; 999px sur les pastilles d'index"

colors:
  dark:
    papier: "#0b0d10"
    planche: "#15181d"
    planche-2: "#1b1f25"
    creux: "#0f1216"
    encre: "#f5f2e9"
    mine: "#a8a094"
    filet: "#343943"
    bleu: "#7f95ff"
    bleu-encre: "#aab7ff"
    rouge: "#ff6a4a"
    rouge-encre: "#ff9b84"
    jaune: "#ffd24a"
    jaune-encre: "#ffe38a"
    vert: "#3fd37f"
    noir: "#050607"
  light:
    papier: "#f5f2e9"
    planche: "#fffdf7"
    planche-2: "#f2eee3"
    creux: "#ebe7db"
    encre: "#16130f"
    mine: "#605a4e"
    filet: "#c9c2b2"
    bleu: "#1f3ad4"
    bleu-encre: "#1a31b4"
    rouge: "#e23a1c"
    rouge-encre: "#c22a10"
    jaune: "#ffc21f"
    jaune-encre: "#7f5a00"
    vert: "#0b7040"
    noir: "#fffdf7"
  alpha:
    topbar: "rgba(papier, .90) sombre · rgba(papier, .92) clair"
    panel: "rgba(planche, .84) sombre · rgba(planche, .88) clair"
    metric: "rgba(planche, .76) sombre · rgba(planche, .82) clair"
    row-line: "rgba(filet, .66) sombre · rgba(filet, .80) clair"
    hover: "rgba(bleu, .06)"

gradients:
  blue: "linear-gradient(115deg, bleu .92 → bleu clair .56 @36% → vert .18 @72% → transparent)"
  warm: "linear-gradient(115deg, rouge .82 → jaune .56 @42% → bleu .12 @78% → transparent)"
  green: "linear-gradient(115deg, vert foncé .88 → vert .42 @44% → bleu .16 @78% → transparent)"
  neutral: "linear-gradient(115deg, encre .13 → bleu .14 @44% → transparent @88%)"
  angle: 115deg
  grain: "feTurbulence fractalNoise, baseFrequency .82, 4 octaves, désaturé, tuile 180px, data: URI"

bauhaus:
  triade: "linear-gradient(90deg, rouge 0 33.34%, jaune 0 66.67%, bleu 0 100%)"
  geo: "clamp(56px, 6.5vw, 96px) · 52px sous 760px"
  cercle: "50%"
  triangle: "polygon(50% 0, 100% 100%, 0 100%)"
  keylines: "3px structure · 2px axe · 1px donnée"
---

# Affiche Harness — spécification du prototype

Ce document décrit **ce que `prototype/` fait réellement**. Il remplace la spécification
Affiche v2.0, qui décrivait un kit différent (`tokens.css`, `kit.css`, `.planche`, `.trait`,
`.mire`, case de 120 px, cerne de 2,5 px) désormais dans `archives/`. Là où les deux
divergent, **c'est ce document qui fait foi** : il a été écrit à partir du construit, pas
l'inverse.

## 1. Posture

Une console de production, pas une collection de cartes SaaS. La page est une toile graphite
continue. Les surfaces sont définies par des lignes, des écarts de lumière et la densité de
l'information — jamais par une ombre ni par un rayon. Archivo porte la voix, IBM Plex Sans
porte l'interface, IBM Plex Mono ne sert qu'aux dates, nombres, états et chemins.

Par-dessus ce socle, une grammaire Bauhaus complète : triade primaire en arrêts francs,
formes élémentaires en correspondance sémantique, keylines graduées, plaque décalée.
Elle est ornementale au sens strict — **aucun de ses gestes ne déplace du contenu**.

Vocabulaire employé comme nomenclature exacte : **papier** (le fond de page), **planche**
(surface porteuse), **creux** (fond enfoncé de champ ou de hero), **filet** (le trait de 1 px),
**encre** (la valeur de texte pleine force), **mine** (le texte secondaire), **case** (l'unité
de trame), **triade** (le filet rouge/jaune/bleu), **plaque** (la couche décalée sans flou),
**champ lumineux** (le gradient directionnel d'un écran).

## 2. Fichiers

| Fichier | Rôle |
|---|---|
| `DESIGN.md` | cette spécification — source unique |
| `final.css` | tokens, shell, composants, couche Bauhaus, responsive |
| `final.js` | contrats d'interaction de référence |
| `index.html` | lanceur des six écrans |
| `ecran-*.html` | un écran par fichier, shell partagé, corps jamais fusionnés |
| `brand-spec.md` | extraction et réconciliation de la référence externe |
| `assets/fonts/` | Archivo, IBM Plex Sans, IBM Plex Mono en `woff2` (latin + latin-ext), servis localement |

**Limite dure du système.** Les templates de CV (`apps/web/src/app/pages/templates/*`) sont
craftés à la main et invariables. Ils déclarent leurs propres variables localement. **Tout
token d'Affiche est donc préfixé `--af-`.** Le système s'arrête à la porte du document.

## 3. Couleur

### Convention dual-mode

Deux blocs `:root` et un attribut : `data-theme="light"` sur `<html>`. **Le sombre est le
défaut** ; le clair est l'option, et il retrouve le papier d'affiche chaud. `color-scheme`
suit le thème pour que les contrôles natifs s'alignent. Le choix est conservé dans
`localStorage` sous la clé `resumate:theme` et appliqué avant le premier rendu.

Ce n'est pas `light-dark()` : les deux thèmes redéfinissent aussi les quatre gradients, ce
qu'une fonction par valeur ne permet pas d'exprimer.

### La règle des deux valeurs

Chaque teinte de la triade existe en deux valeurs :

| | Emploi | Seuil |
|---|---|---|
| `--af-<teinte>` | **aplat graphique** : forme élémentaire, plaque, barre de métrique, fond de bouton | non-texte |
| `--af-<teinte>-encre` | **dès qu'il y a du texte** en cette couleur sur le papier | 4,5:1 |

Contrastes mesurés sur `--af-papier` :

| Texte | Sombre | Clair |
|---|---|---|
| `encre` | 17,38 | 16,54 |
| `mine` | 7,52 | 6,11 |
| `bleu-encre` | 10,12 | 8,76 |
| `rouge-encre` | 9,52 | 5,16 |
| `jaune-encre` | 15,39 | 5,58 |
| `vert` | 10,04 | 5,51 |
| `noir` sur aplat `bleu` (bouton primaire) | 7,38 | 7,90 |

Toutes les valeurs de texte passent AA dans les deux thèmes. Les écarts sur `planche` et
`creux` restent supérieurs à 4,5:1 (minimum observé : 4,68 pour `rouge-encre` sur `creux`
en clair). Voir §11 pour les deux limites connues.

### Rôles disjoints, non négociables

| Token | Rôle **unique** |
|---|---|
| bleu | structure · action primaire · lien · focus · progression · statut « réponse » |
| rouge | destruction · erreur · **et la plaque décalée de toute action primaire** |
| jaune | attention · sélection · onglet actif · état « à faire / brouillon » |
| vert | validation et statut positif uniquement — **jamais sur un élément interactif** |

Une couleur sans rôle est un bug.

**Budget d'accent.** Un champ lumineux dominant par écran. La triade Bauhaus n'entre pas
dans ce budget : elle est structurelle et se répète à l'identique sur les sept surfaces.

## 4. Typographie

**Archivo porte la voix.** L'affiche est en `font-stretch: 125%`, capitales,
`letter-spacing: -.045em`, interligne `.86`. C'est la seule police à taille display.

**IBM Plex Sans porte l'interface** — corps à 14 px / 1.5. Jamais de display en Plex Sans,
jamais de corps de texte en Archivo.

**IBM Plex Mono est réservé** aux dates, nombres tabulaires, libellés d'état, chemins de
profil et étiquettes de section. Employé comme voix générale, il transforme n'importe quel
système en tableau de bord d'ingénierie.

`font-variant-numeric: tabular-nums` est global sur `body`. `text-wrap: pretty` sur les
titres et paragraphes, `balance` sur `.display`.

Les trois familles sont **embarquées** en `woff2` dans `assets/fonts/`, importées par
`final.css`. Aucun appel réseau à l'exécution.

## 5. Layout et grille

Conteneur : **1280 px**, gouttière `clamp(16px, 3vw, 36px)`. Échelle d'espacement
**4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96**.

La trame `.calque-trame` est en `position: fixed`, `pointer-events: none`, `aria-hidden`,
`overflow: hidden`. Cases de **96 px** (76 px sous 760 px), lignes de bleu à 5 %.

Angles francs partout. Le seul rayon admis est **50 % sur un vrai cercle** — forme
élémentaire porteuse de sens — et `999px` sur les pastilles d'index, qui deviennent des
gélules quand leur contenu est plus long que deux caractères.

Aucune ombre floue nulle part. La profondeur vient de la plaque décalée, sans flou.

Cible interactive minimale : **44 px**.

## 6. Lumière : le contrat de gradient

Chaque écran dispose d'un seul champ lumineux dominant, directionnel à 115°, qui part d'un
bord et disparaît avant l'autre :

| Gradient | Signifie |
|---|---|
| `--af-gradient-blue` | structure, reprise, progression, action primaire |
| `--af-gradient-warm` | édition, transformation, choix de modèle |
| `--af-gradient-green` | pilotage positif, validation |
| `--af-gradient-neutral` | historique, paramètres, contextes neutres |

**Le grain n'existe que sur sa lumière.** La surface hôte déclare son gradient dans
`--hero-gradient` ; le calque de grain reçoit **exactement** cette valeur comme `mask-image`
et se pose en `mix-blend-mode: screen` à 18 % (16 % sur la tête du tableau de bord). L'alpha
du masque suit l'alpha du dégradé : le grain naît avec la couleur et meurt avec elle. Il ne
salit jamais le papier nu.

**Budget : une surface lumineuse par écran.** Le hero, ou la tête du tableau de bord — jamais
les deux. Les cartes de métrique peuvent recevoir un faible écho teinté
(`color-mix()` à 14–19 %) ; aucune autre surface ne reçoit un second geste spectaculaire.
Le gradient indique une zone active ou un état, jamais un fond décoratif de carte générique.

## 7. Couche Bauhaus

Grammaire secondaire, appliquée à l'identique sur les sept surfaces. Contrainte
structurelle : **chaque geste est un pseudo-élément hors flux, une épaisseur de filet ou un
token de couleur.** Aucun ne modifie `grid-template`, `gap` ni la taille des cibles.

**Triade primaire.** Rouge, jaune, bleu en arrêts francs, jamais fondus. Filet de 3 px pleine
largeur sous la barre haute ; puis en segment court sous chaque tête de section (132 px),
chaque tête de panneau (72 px), le bloc chiffré du hero (96 px) et le pied de page (180 px).

**Correspondance Kandinsky.** Cercle = bleu, triangle = jaune, carré = rouge. La règle est
sémantique, pas décorative : elle pilote les pastilles d'état, les indicateurs de métrique,
les jalons du journal et les cartes du lanceur.

| Surface | Cercle bleu | Triangle jaune | Carré rouge |
|---|---|---|---|
| `.status` | statut « réponse » | statut « à faire » | — |
| `.metric` | `--blue` | `--warm` | — (`--green` = anneau vert, `default` = carré encre) |
| `.timeline-item` | 3n+3 | 3n+2 | 3n+1 |
| `.screen-card` | 3n+3 | 3n+2 | 3n+1 |
| `.geo` | 3ᵉ forme | 2ᵉ forme | 1ʳᵉ forme |

**Composition d'en-tête `.geo`.** Bande carré / triangle / cercle en aplats pleins affleurant
l'angle supérieur droit du hero. Taille `clamp(56px, 6.5vw, 96px)`, 52 px sous 760 px. La
zone de tête **réserve sa hauteur** par `padding-top: calc(var(--af-geo) + 26px)` via
`:has(.geo)` — jamais par recouvrement.

**Keylines graduées.** Trois épaisseurs, pas quatre :

| Épaisseur | Emploi |
|---|---|
| 3 px encre | structure : haut de panneau, tête de section, tête de panneau, en-tête de tableau, onglets, pied de page |
| 2 px | axe du journal, pastilles d'index |
| 1 px filet | donnée : bordure de panneau, lignes de tableau, champs |

**Plaque décalée.** Toute action primaire porte une plaque rouge de 3 px, qui passe à 5 px au
survol et disparaît à l'appui. Même geste sur l'aperçu A4 (12 px), la notification (6 px) et
la carte de modèle sélectionnée (8 px, en bleu). Les boutons neutres portent une plaque encre
de 3 px au survol seulement.

**Substrat d'affiche.** La trame de 96 px est assumée à pleine opacité, complétée par un
cercle bleu ouvert et un quart de disque rouge, fixes, sous 16 % d'opacité. Ils restent
derrière la donnée et disparaissent en impression, en contraste forcé et en transparence
réduite.

## 8. Composants

Noms de classes réels de `final.css`. Aucun composant listé ici n'est théorique.

**Shell** — `.app-shell` · `.page` (1280 px) · `.calque-trame` · `.topbar` / `.topbar__inner`
(72 px, collante, translucide, filet triadique) · `.brand` · `.main-nav`
(`aria-current="page"` → soulignement jaune de 4 px + carré rouge) · `.top-actions` ·
`.theme-toggle` (injecté par `final.js`) · `.mobile-menu` · `.page-main` · `.section` ·
`.section-head` · `.footer`

**Tête d'écran** — `.hero` (+ `--warm` / `--green` / `--neutral`, min 420 px, 520 px sous
760 px) · `.hero__aside` (bloc chiffré, filet triadique de 4 px, carré jaune à plaque rouge) ·
`.hero__number` · `.hero__actions` · `.geo`

**Typographie** — `.eyebrow` (pastille circulaire en `currentColor`) · `.display`
(+ `--medium`) · `.lede` · `.mono` · `.muted`

**Données** — `.metric-grid` / `.metric` (+ `--blue` / `--green` / `--warm` ; barre de 6 px
et glyphe de 26 px) · `.metric__label` · `.table-wrap` / `.data-table` (min 720 px, en-tête à
3 px, survol de ligne) · `.status` (5 tons : `--blue` `--green` `--red` `--yellow` `--muted`) ·
`.list` / `.list-item` / `.list-item__index` · `.progress` (crans de 10 %) · `.bar-list` /
`.bar-row` · `.timeline` / `.timeline-item`

**Surfaces** — `.panel` / `.panel__head` (58 px) / `.panel__body` · `.grid-2` (1.25fr /
.75fr) · `.grid-3` · `.screen-grid` / `.screen-card`

**Saisie** — `.toolbar` · `.field` / `.field--full` · `.input` (et `input`, `select`,
`textarea` — 44 px, rayon 0, fond creux) · `.search` · `.form-grid` (2 colonnes) · `.tabs` /
`.tab` / `.tab-panel` · `.switch` (52 × 28, pastille circulaire quand coché) · `.setting-row`

**Actions** — `.btn` (+ `--primary` bleu à plaque rouge, `--quiet` filet, `--danger` rouge) ·
`.icon-btn` (44 × 44)

**Éditeur** — `.editor-layout` (1fr / .72fr) · `.preview-sheet` (ratio A4 210/297, collante à
96 px, papier crème fixe quel que soit le thème, plaque rouge de 12 px, cercle bleu) ·
`.preview-line` · `.preview-block`

**Modèles** — `.template-card` (+ `[aria-selected]`) / `__preview` / `__meta` / `__actions`

**Retour** — `.toast` (bas-droite, 2 600 ms, plaque rouge de 6 px)

**Icônes.** Aucun jeu d'icônes n'est chargé dans le prototype. Les rares glyphes sont des
caractères (`☰`) ou des formes CSS. Jamais d'icône à côté d'un titre.

## 9. Contrats d'interaction

`final.js` décrit les comportements attendus. Chacun se branche par attribut de données, sans
dépendance de framework — la traduction en composants Angular doit préserver ces contrats.

| Attribut | Contrat |
|---|---|
| `[data-theme-toggle]` | injecté dans `.top-actions` ; bascule `data-theme` sur `<html>`, persiste dans `resumate:theme` |
| `[data-menu]` + `[data-main-nav]` | navigation repliée sous 1050 px ; `data-open` + `aria-expanded` |
| `[data-tabs]` + `[data-tab-panel]` | onglets liés par `aria-controls` ; `aria-selected` sur l'onglet, `hidden` sur le panneau |
| `[data-switch]` | bascule `aria-checked` |
| `[data-toast-action]` | affiche `[data-toast]` avec `data-toast-title` / `data-toast-message`, 2 600 ms |
| `[data-search]` | filtre `[data-search-item]` sur le texte, insensible à la casse |
| `[data-filter]` | `aria-pressed` dans le groupe ; filtre `[data-filter-item]` par `data-kind`, `all` réinitialise |
| `[data-template-card]` + `[data-select-template]` | sélection exclusive par `aria-selected` + notification |
| `[data-completion]` + `[data-completion-bar]` | pourcentage de champs non vides de `[data-editor-form]`, recalculé à la saisie |

Aucune animation d'entrée. Le mouvement est un retour d'état : 110 ms sur les boutons et
l'interrupteur, 180 ms sur la notification.

## 10. Responsive

| Palier | Comportement |
|---|---|
| ≤ 480 px | métriques en 1 colonne · actions du hero et barre d'outils en pile pleine largeur · `.bar-row` resserré · en-tête de journal en colonne · glyphe de métrique réduit |
| ≤ 560 px | libellé du sélecteur de thème masqué, bouton carré de 44 px |
| ≤ 760 px | case de trame à 76 px · `--af-geo` à 52 px · hero en 1 colonne (min 520 px) · `.grid-2` et `.editor-layout` en 1 colonne · aperçu A4 non collant, centré, max 430 px · `.form-grid` en 1 colonne · `.grid-3` et `.screen-grid` en 1 colonne · tête de section en colonne · sous-titre de marque masqué |
| ≤ 1050 px | navigation repliée derrière le bouton menu · action primaire de la barre haute masquée · métriques, `.grid-3` et `.screen-grid` en 2 colonnes |
| ≥ 1280 px | conteneur à pleine largeur, la trame occupe le débord |

Zéro défilement horizontal attendu à **360, 390, 430, 600, 768, 1024, 1366, 1440 et 1920 px**.

## 11. Accessibilité et neutralisations

- Focus visible sur 100 % des éléments interactifs : `outline: 2px solid var(--af-bleu)`,
  `outline-offset: 3px`, rayon 0.
- Cibles de 44 px minimum, boutons d'icône compris.
- Tous les calques décoratifs portent `pointer-events: none` et `aria-hidden="true"`.
- `prefers-reduced-motion: reduce` → transitions ramenées à 0,01 ms, défilement doux coupé.
- `prefers-reduced-transparency: reduce` → grain du hero supprimé, flou de la barre haute
  supprimé.
- `forced-colors: active` → gradients, grain, trame, composition `.geo`, glyphes de métrique
  et filet triadique retirés ; la structure reste portée par les bordures.
- `@media print` → barre haute, trame, notification et menu masqués ; fond blanc, texte noir ;
  hero, panneaux, métriques et cartes de modèle en `break-inside: avoid` ; gestes Bauhaus
  décoratifs retirés.

### Limites connues

Deux valeurs n'atteignent pas 3:1 et sont assumées :

1. **`--af-filet` sur `--af-papier`** — 1,68 en sombre, 1,58 en clair. C'est un filet de
   séparation, pas une frontière porteuse d'information : chaque zone qu'il délimite est
   aussi identifiée par un titre, un fond ou une keyline de 3 px. À relever si un audit
   formel l'exige.
2. **Aplat `jaune` sur `papier` en thème clair** — 1,44. Le triangle jaune de `.geo` et le
   soulignement de navigation ne se posent jamais sur le papier nu (hero teinté, fond de
   planche), mais la marge est mince. Le texte jaune passe toujours par `jaune-encre`
   (5,58), qui lui est conforme.

## 12. Contrat des écrans

| Écran | Champ lumineux | Corps fonctionnel |
|---|---|---|
| Accueil | bleu — reprise | profils récents + tâches à terminer + activité |
| Éditeur | rouge-jaune | formulaire à onglets + aperçu A4 fixe + complétude |
| Tableau de bord | vert (tête de section) | métriques + pipeline + actions + candidatures |
| Historique | graphite-bleu | journal filtrable + restauration + filtres |
| Modèles | rouge-jaune | galerie comparative + sélection |
| Paramètres | graphite-bleu | compte + voix + sécurité + données |

**Un écran = un fichier.** Le shell est partagé ; les corps ne sont jamais fusionnés dans une
page de démonstration. `index.html` est un lanceur, pas une vitrine de tous les écrans.

## 13. Do's and Don'ts

**À faire**

- Une seule trame, cases de 96 px, un seul niveau.
- Un seul champ lumineux par écran, et le grain masqué par ce champ.
- Traiter la couleur comme une **surface** : aplat, barre, forme élémentaire, plaque.
- Trois épaisseurs de keyline, pas quatre.
- Donner la profondeur par une plaque décalée, sans aucun flou.
- Réserver le mono aux dates, nombres, états et chemins.
- Préfixer chaque token `--af-`.
- Faire porter chaque geste Bauhaus par un pseudo-élément hors flux.
- Réserver la place des formes élémentaires par `padding`, jamais par recouvrement.
- 44 px de cible tactile minimum.
- La donnée avant l'ornement : chiffres, statuts, dates et actions visibles avant toute
  illustration.

**À ne pas faire**

- Poser un second geste spectaculaire sur un écran qui a déjà son champ lumineux.
- Employer le mono comme voix générale.
- Poser un `border-radius` sur un rectangle.
- Utiliser une ombre floue.
- Employer le vert sur un élément interactif.
- Faire du gradient le fond décoratif d'une carte générique.
- Ajouter une quatrième épaisseur de filet.
- Ajouter une animation d'entrée. Le mouvement est un retour d'état.
- Mettre une icône à côté d'un titre.
- Exposer dans le produit des contrôles de conception : sélecteur de plateforme, compteur
  d'écrans, badge de maquette.
- Toucher un fichier de `pages/templates/*`.

## 14. Reste ouvert

- **Logo.** `assets/logo.png` est un substitut, posé à 26 px dans la barre haute, filtré en
  niveaux de gris. À remplacer par la marque définitive.
- **Jeu d'icônes.** Aucun n'est chargé. Un jeu tracé sur mesure — carrés, cercles, triangles,
  cohérent avec la correspondance Kandinsky — serait le prolongement naturel du système, mais
  c'est un livrable supplémentaire.
- **Composants non couverts par le prototype.** L'ancien kit v2 documentait des pièces que les
  six écrans n'exercent pas : modale, bandeau de multi-édition, liste réordonnable, sélecteur
  lié/disponible, palette de compétences, état de chargement, squelette, infobulle, bandeau
  cookies. Elles restent consultables dans `archives/index-kit-affiche.html` mais **ne sont
  pas spécifiées ici** : les retraduire dans Affiche Harness demande une passe dédiée.
- **Le papier.** Le sombre est le défaut par choix de posture. Bascule sur un seul attribut ;
  les deux thèmes utilisent exactement les mêmes composants et les mêmes gradients
  fonctionnels.
