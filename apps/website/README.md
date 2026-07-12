# Website

This directory is reserved for the future public marketing website.

It is intentionally empty: no framework or implementation has been chosen yet.

## Separation from `apps/web`

- `apps/web` hosts the Angular product application (Resumate CV builder).
- `apps/website` will host a separate public-facing marketing site with its own lifecycle, SEO concerns, and deployment pipeline.
- The two applications share no runtime code or routes.

## Future deployment intent

- The website should be independently deployable, with no dependency on PocketBase or the MCP service.
- Expected to use a different framework (e.g. Astro, Next.js, plain HTML/CSS/JS) suited for static or server-rendered content.
