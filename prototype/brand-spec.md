# Affiche / Harness — spécification de synthèse

Source complémentaire : `https://deepseek.com/harness/en/`, inspectée visuellement le 18 août 2026. La page est protégée par un challenge réseau ; les valeurs ci-dessous ne recopient donc pas ses couleurs. Elles traduisent sa posture (canvas sombre, lumière froide, barre d'outil condensée, grande typographie centrale) dans les fondations vérifiées d'Affiche.

## Tokens de base

```css
:root {
  --bg:      oklch(15.8% 0.007 258.4);
  --surface: oklch(20.8% 0.011 260.7);
  --fg:      oklch(96.1% 0.012 91.5);
  --muted:   oklch(70.9% 0.019 78.2);
  --border:  oklch(34.4% 0.019 264.3);
  --accent:  oklch(70.0% 0.157 272.9);

  --font-display: 'Archivo', 'Helvetica Neue', system-ui, sans-serif;
  --font-body: 'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
}
```

## Posture observée et adaptation

- Installer une toile presque noire et continue ; les surfaces se distinguent par des écarts de lumière et des lignes, pas par une collection de cartes flottantes.
- Utiliser un grand champ lumineux froid comme geste dominant. Les dégradés restent directionnels, texturés et liés à une fonction : contexte, progression, statut ou zone active.
- Condenser la navigation dans un rail horizontal net, avec des libellés courts et des contrôles contrastés. Affiche conserve cependant ses angles francs et ses plaques hors-repérage.
- Associer une typographie d'affiche très large à des légendes mono compactes. Le mono reste réservé aux données, dates, états et raccourcis.
- Maintenir une forte économie d'effets : une zone lumineuse principale par écran, une trame globale discrète et aucun flou décoratif sur les surfaces porteuses.

## Réconciliation avec Affiche

La triade Affiche reste la grammaire fonctionnelle : bleu pour la structure et l'action, rouge pour l'erreur et la destruction, jaune pour l'attention et la sélection, vert uniquement pour le statut positif. La référence Harness influence la composition et la lumière, pas l'identité, les composants ou la palette de statut.
