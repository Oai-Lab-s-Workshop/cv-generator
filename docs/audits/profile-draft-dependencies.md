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

## Implementation Constraint

- Remove the draft concept without deleting legacy no-template profile records automatically.
- Keep legacy no-template records editable and provide a path to assign a template safely.
