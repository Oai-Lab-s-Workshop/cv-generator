# Profile Draft Dependencies Audit

Date: 2026-05-16

## Findings

- Draft profiles are currently a frontend concept derived from `!profile.template` in `HomePage`.
- New CV profiles are created without a template through `createCurrentUserCvProfile()`, using a temporary `brouillon--<user>--<timestamp>` slug.
- Generated profile routes use `slug`; `setTemplateForCurrentUserCvProfile()` replaces the draft slug with `<template>--<profileId>`.
- `ProfileEditorPage` can load legacy no-template profiles because template-specific extra fields are guarded behind the selected template.
- No direct frontend dependency requires a separate draft profile section beyond home page creation/listing.

## Baseline Checks

- `npm run build` in `frontend`: passes.
- `npm test -- --runInBand` in `frontend`: fails before implementation in `cv-shell-page.spec.ts` preview/print admin bar expectations.

## Final Verification

- `npm run build` in `frontend`: passes after implementation.
- `npm test -- --runInBand` in `frontend`: still fails only on the same pre-existing `cv-shell-page.spec.ts` preview/print admin bar expectations recorded at baseline.

## Reusable Material Flow Correction

- Added a dedicated profile material page for reusable job and skill source data.
- Removed job and skill CRUD from the CV profile editor; it now only selects existing records for each CV.
- `npm run build` in `frontend`: passes after the correction.
- `npm test -- --runInBand` in `frontend`: still fails only on the same pre-existing `cv-shell-page.spec.ts` preview/print admin bar expectations recorded at baseline.

## Material Edit Interaction

- `Modifier` now leaves the edited job or skill visibly highlighted in its list.
- `Modifier` scrolls to the relevant prefilled form and focuses the first field.
- `npm run build` in `frontend`: passes after the interaction update.
- `npm test -- --runInBand` in `frontend`: still fails only on the same pre-existing `cv-shell-page.spec.ts` preview/print admin bar expectations recorded at baseline.

## Material Form Prefill Fix

- Replaced `NgModel` bindings in the material forms with explicit signal-backed `[value]` bindings and typed input/change setters.
- Delayed scroll/focus to the next animation frame so it runs after the prefilled values render.
- `npm run build` in `frontend`: passes after the prefill fix.
- `npm test -- --runInBand` in `frontend`: still fails only on the same pre-existing `cv-shell-page.spec.ts` preview/print admin bar expectations recorded at baseline.

## Material Dark-Mode Visibility Fix

- Form controls now explicitly use dark text, a visible caret, readable placeholders, and `color-scheme: light` while keeping their white backgrounds.
- Material cards, state cards, and highlighted edit rows now explicitly set readable text colors for dark-mode browsers.
- `npm run build` in `frontend`: passes after the dark-mode visibility fix.
- `npm test -- --runInBand` in `frontend`: still fails only on the same pre-existing `cv-shell-page.spec.ts` preview/print admin bar expectations recorded at baseline.

## Rich Responsibilities Editing

- Replaced the plain responsibilities textarea with a lightweight native rich-text editor that stores HTML in the existing `jobs.responsibilities` field.
- Added toolbar actions for bold, italic, unordered list, ordered list, and clearing formatting.
- Empty editor markup is normalized to an empty value before saving.
- `npm run build` in `frontend`: passes after the rich editor change.
- `npm test -- --runInBand` in `frontend`: still fails only on the same pre-existing `cv-shell-page.spec.ts` preview/print admin bar expectations recorded at baseline.

## Implementation Constraint

- Remove the draft concept without deleting legacy no-template profile records automatically.
- Keep legacy no-template records editable and provide a path to assign a template safely.
