---
version: "alpha"
name: Resumate
description: "A print-conscious CV builder with a calm blue-slate admin shell and editorial resume templates accented by indigo, violet, and precise document geometry."
colors:
  background: "#FFFFFF"
  on-background: "#2E2E48"
  surface: "#FFFFFF"
  surface-dim: "#EEF2F8"
  surface-bright: "#FFFFFF"
  surface-container-lowest: "#FFFFFF"
  surface-container-low: "#F8FAFC"
  surface-container: "#F7F9FC"
  surface-container-high: "#EFF6FF"
  surface-container-highest: "#E0E7FF"
  on-surface: "#18202B"
  on-surface-strong: "#111827"
  on-surface-muted: "#475569"
  on-surface-subtle: "#6B7280"
  on-surface-faint: "#79819A"
  outline: "#CBD5E1"
  outline-variant: "#D7DEEA"
  outline-soft: "#E2E8F0"
  outline-resume: "#D8DEE9"
  primary: "#0F3D8C"
  on-primary: "#FFFFFF"
  primary-container: "#EFF6FF"
  on-primary-container: "#0F3D8C"
  secondary: "#516CF7"
  on-secondary: "#FFFFFF"
  secondary-container: "#E0E7FF"
  on-secondary-container: "#1D4ED8"
  tertiary: "#9251F7"
  on-tertiary: "#FFFFFF"
  tertiary-container: "#EFE2F9"
  on-tertiary-container: "#5531A7"
  resume-ink: "#102030"
  resume-ink-soft: "#475467"
  resume-copy: "#888888"
  resume-sidebar-start: "#101A2D"
  resume-sidebar-end: "#1B3154"
  resume-sidebar-text: "#F8FBFF"
  resume-sidebar-muted: "#9FB6D8"
  supa-surface: "#F7F9FC"
  supa-dark-surface: "#2E2E48"
  supa-dark-panel: "#232339"
  supa-violet: "#A478E8"
  supa-indigo: "#516CF7"
  supa-periwinkle: "#B1BDFB"
  link: "#0F4AA5"
  success: "#15803D"
  success-container: "#F0FDF4"
  success-outline: "#BBF7D0"
  error: "#B91C1C"
  error-container: "#FFF1F2"
  error-soft-container: "#FFF7F7"
  error-outline: "#FECACA"
  token-code-background: "#10203B"
  token-code-text: "#F8FBFF"
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 56px
    fontWeight: "600"
    lineHeight: 58px
    letterSpacing: -0.02em
  display-md:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: "600"
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: "600"
    lineHeight: 43px
  headline-md:
    fontFamily: Outfit
    fontSize: 26px
    fontWeight: "600"
    lineHeight: 34px
    letterSpacing: 0.16em
  headline-sm:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 28px
  resume-title:
    fontFamily: Outfit
    fontSize: 27px
    fontWeight: "600"
    lineHeight: 31px
  resume-heading:
    fontFamily: Outfit
    fontSize: 19px
    fontWeight: "600"
    lineHeight: 23px
  body-lg:
    fontFamily: DM Sans
    fontSize: 17px
    fontWeight: "400"
    lineHeight: 29px
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  body-sm:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 21px
  label-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: "700"
    lineHeight: 20px
  label-sm:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: "700"
    lineHeight: 16px
    letterSpacing: 0.14em
  label-caps:
    fontFamily: DM Sans
    fontSize: 13px
    fontWeight: "700"
    lineHeight: 18px
    letterSpacing: 0.16em
  document-body:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 19px
  document-small:
    fontFamily: DM Sans
    fontSize: 11px
    fontWeight: "500"
    lineHeight: 15px
  mono-sm:
    fontFamily: SFMono-Regular
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 20px
  full: 9999px
radii:
  image-avatar: 6px
  form-control: 12px
  button: 13px
  card: 16px
  large-card: 20px
  skill-chip: 8px
  pill: 9999px
spacing:
  unit: 8px
  xxxs: 2px
  xxs: 4px
  xs: 6px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  xxl: 24px
  xxxl: 32px
  section: 40px
  page-x: 24px
  page-y: 48px
  admin-max-width: 1080px
  editor-max-width: 1160px
  gallery-max-width: 1200px
  resume-width: 210mm
  resume-height: 297mm
  resume-print-margin: 12mm
  resume-column-gap: 8mm
shadows:
  card-soft: "0 18px 50px rgba(15, 23, 42, 0.06)"
  card-medium: "0 20px 55px rgba(15, 23, 42, 0.08)"
  document-preview: "0 20px 70px rgba(15, 23, 42, 0.12)"
  floating-bar: "0 10px 32px rgba(15, 23, 42, 0.10)"
  tile: "0 0 10px rgba(0, 0, 0, 0.15)"
  supa-chip: "0 1.5mm 4mm rgba(98, 76, 173, 0.06)"
  timeline-dot: "0 0 6px #E2E6EE"
elevation:
  flat:
    shadow: none
    surface: "{colors.surface}"
  raised-card:
    shadow: "{shadows.card-soft}"
    surface: "{colors.surface}"
  preview-card:
    shadow: "{shadows.card-medium}"
    surface: "{colors.surface}"
  document:
    shadow: "{shadows.document-preview}"
    surface: "{colors.surface}"
  floating-control:
    shadow: "{shadows.floating-bar}"
    surface: "#F8FAFC"
motion:
  duration-fast: 150ms
  duration-base: 200ms
  duration-slow: 300ms
  marquee-duration: 10s
  easing-standard: ease
  easing-linear: linear
  interaction-disabled-opacity: 0.7
  hover-decoration: underline
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    padding: 13px 16px
  button-secondary:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    padding: 13px 16px
  button-neutral:
    backgroundColor: "{colors.outline-soft}"
    textColor: "#1E293B"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    padding: 13px 16px
  admin-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 20px
  editor-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xxl}"
    padding: 20px
  template-preview-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xxl}"
    padding: 0px
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 13px 14px
  floating-admin-bar:
    backgroundColor: "#F8FAFC"
    textColor: "#1E293B"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: 9px 11px
  resume-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.resume-ink}"
    typography: "{typography.document-body}"
    rounded: "{rounded.xl}"
    padding: 16px 18px
  resume-skill-chip:
    backgroundColor: "#EFF4FF"
    textColor: "#173B70"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 10px 14px
  supa-skill-cell:
    backgroundColor: "{colors.surface}"
    textColor: "#7C4DFF"
    typography: "{typography.document-small}"
    rounded: "{rounded.md}"
    padding: 2px
  status-error:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.error}"
    rounded: "{rounded.xl}"
    padding: 20px
  status-success:
    backgroundColor: "{colors.success-container}"
    textColor: "{colors.success}"
    rounded: "{rounded.xl}"
    padding: 20px
---

## Overview

CV Generator has a pragmatic, document-first visual identity. The product shell is calm and administrative: centered pages, white cards, blue actions, slate copy, and generous spacing. The CV outputs are more expressive but still restrained, ranging from minimal editorial pages to a dark-sidebar modern template and a polished violet/indigo Supa template.

The overall impression should be trustworthy, precise, and export-ready. Screens should feel like a professional back office for managing resumes, while rendered CVs should feel like printable artifacts with strong hierarchy, durable contrast, and A4 geometry.

## Colors

The admin interface is built from white surfaces, pale blue-gray page backgrounds, slate text, and a deep navy primary action color. Use `#0F3D8C` for primary decisions, links to generated CVs, and decisive save/create actions. Use pale blue containers for secondary actions so the screen stays quiet and work-focused.

Resume templates introduce additional palettes without breaking the core identity. Classic and Minimal templates rely on black ink, gray metadata, white paper, and fine gray rules. Modern adds a deep navy gradient sidebar with white text. Supa uses the strongest brand expression: violet-to-indigo gradients, lavender borders, precise A4 sizing, and pill-like skill systems.

Semantic colors are soft and low-alarm in their containers. Errors use red text on very pale red panels; success states use green outlines and pale green fills. Avoid saturated full-bleed semantic panels unless the message is critical.

## Typography

Use DM Sans as the default interface and document body family. It gives forms, admin copy, metadata, and resume paragraphs a friendly but neutral tone. Use Outfit for page titles, section headings, and resume display headings; it provides the rounded geometric contrast that makes CV headers and admin hero titles distinct.

Hierarchy is direct rather than decorative. Admin hero titles can be large and fluid, while card titles stay compact. Resume section headings often use uppercase labels, wide letter spacing, and strong rules to create scan-friendly printed documents. Metadata, dates, template labels, and eyebrow text should use small bold caps with generous tracking.

## Layout

Layout is centered and grid-driven. Admin pages use a max-width container between 1080px and 1200px, 16px to 24px horizontal padding, and responsive cards that collapse to a single column below tablet widths. Form groups are compact but not cramped, with 12px to 16px gaps and consistent rounded inputs.

The CV rendering layer is A4-first. Treat `210mm x 297mm` as a first-class layout constraint, with print margins, millimeter-based spacing, and explicit print behavior. Preview pages may sit on a pale blue-gray background with a large document shadow, but print output should remove decorative shadows and preserve clean paper geometry.

## Elevation & Depth

Depth is soft, ambient, and functional. Admin cards use large blurred shadows at low opacity, creating separation without making the interface feel heavy. Template preview cards use slightly stronger shadows because they represent physical documents on a desk-like canvas.

The floating admin bar is the only glass-like element: a translucent pale surface with blur, a pill shape on desktop, and a soft shadow. Do not spread glassmorphism throughout the UI; it is a utility treatment for overlaid controls, not the core visual language.

## Shapes

The shape language is rounded but professional. Cards usually use 16px or 20px radii, buttons and inputs use 12px to 13px radii, and utility controls can become full pills. Resume chips and project cards use smaller 8px to 16px radii depending on the template.

Print views may reduce ornamentation. Classic print skills become square white chips with simple borders, and document rules become more important than shadows or fills.

## Components

Primary buttons are deep navy with white text, bold labels, and broad padding. Secondary buttons use a pale blue fill with navy or bright blue text. Disabled controls reduce opacity and use a waiting cursor rather than changing color families.

Cards are the main admin building block. They should have white backgrounds, gray-blue borders, rounded corners, and low-opacity slate shadows. State cards reuse this structure with tinted backgrounds and semantic borders.

Inputs and selects should feel native and efficient: white fill, gray-blue border, inherited typography, 12px radius, and enough vertical padding for comfortable scanning. Avoid ornate focus or hover states that would compete with the resume preview content.

Resume components prioritize legibility and export fidelity. Use thin borders, section rules, compact metadata, and strong heading contrast. Project cards and skill chips may use brand gradients or blue fills, but content density must remain suitable for a one-page CV.

## Do's and Don'ts

Do keep admin screens calm, bright, and card-based.

Do preserve A4 dimensions and print-specific simplification for resume output.

Do use blue for administrative actions and violet/indigo for Supa resume accents.

Do use uppercase tracked labels for eyebrows, template IDs, and CV section headings.

Do use shadows for screen previews, then remove or minimize them for print.

Don't introduce unrelated accent colors outside semantic states or existing social/link colors.

Don't make the admin shell visually louder than the CV previews.

Don't reference implementation variables, class names, or source files when applying this design system.

Don't rely on animation except for intentional decorative skill marquees or subtle interaction feedback.
