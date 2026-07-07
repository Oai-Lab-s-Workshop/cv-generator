# Docker Compose Plan

This document is historical and predates the current one-domain frontend/PocketBase model. The current Compose setup keeps PocketBase internal to Docker and exposes PocketBase publicly only through the frontend nginx proxy (`/api/` and `/_/`).

## Goal

Replace the current PocketBase-only `docker-compose.yml` with a development-oriented stack that runs:

- Angular on `${FRONTEND_BASE_URL}`
- PocketBase behind the frontend proxy
- Persistent PocketBase data via `./pb_data`
- Shared network so Angular can call PocketBase by service name inside Docker
- A Codespaces-ready devcontainer that starts the same Docker Compose stack

## Current Repo State

- `docker-compose.yml` currently starts only PocketBase.
- `README.md` documents the default frontend port and the configurable environment variables.
- `frontend/package.json` exposes `npm start` as `ng serve --host 0.0.0.0`, which is suitable for a Docker dev container.
- No frontend `Dockerfile` exists yet.
- `.devcontainer/devcontainer.json` uses a generic base image and forwards ports, but its setup scripts only start PocketBase and expect Angular to run separately in the workspace.

## Recommended Development Compose

Use two services:

1. `pocketbase`
2. `frontend`

### `pocketbase`

- Keep the existing image-based setup.
- Keep only the PocketBase internal port configurable.
- Keep `./pb_data:/pb_data` and `./pb_migrations:/pb_migrations`.
- Keep the healthcheck.

### `frontend`

- Base image: `node:22-alpine` or `node:20-alpine`
- Working directory: `/app`
- Mount `./frontend` into `/app`
- Add a named volume for `/app/node_modules` so host and container dependencies do not conflict
- Expose the frontend port with `FRONTEND_PORT` and `FRONTEND_INTERNAL_PORT`.
- Command: install dependencies then run Angular dev server
- Add environment for API base URL if the app uses one later
- Depend on `pocketbase`

## Proposed Compose Shape

```yaml
services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    container_name: resumate-pb
    restart: unless-stopped
    environment:
      TZ: UTC
    volumes:
      - ./pb_data:/pb_data
      - ./pb_migrations:/pb_migrations
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:${POCKETBASE_INTERNAL_PORT:-8090}/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: node:22-alpine
    container_name: resumate-web
    working_dir: /app
    restart: unless-stopped
    ports:
      - "${FRONTEND_PORT:-4200}:${FRONTEND_INTERNAL_PORT:-4200}"
    volumes:
      - ./frontend:/app
      - frontend_node_modules:/app/node_modules
    command: sh -c "npm install && npm start"
    depends_on:
      pocketbase:
        condition: service_started

volumes:
  frontend_node_modules:
```

## Devcontainer Replacement For GitHub Codespaces

Replace the current `.devcontainer` setup so Codespaces works with the Docker Compose workflow directly instead of mixing containerized PocketBase with a host-run Angular process.

### Recommended Approach

- Keep using a lightweight devcontainer image with Docker access
- Configure the devcontainer to start from the repository root
- Use `postCreateCommand` only for lightweight setup, not for starting long-running app processes manually
- Let Docker Compose own both `frontend` and `pocketbase`
- Forward the frontend port only for app/PocketBase access
- Set port labels so Codespaces opens Angular automatically

### Devcontainer Responsibilities

1. Ensure Docker CLI access is available in Codespaces
2. Run `docker compose up -d` after create, or provide a single documented task/command to do so
3. Avoid separate `npm install` and `npm start` steps on the host when the frontend is already containerized
4. Keep Angular CLI installation inside the frontend container, not globally in the devcontainer, unless there is a strong editor-only need

### Planned Devcontainer Changes

- Replace the current `post-create.sh` and `setup.sh` flow with a compose-first workflow
- Update `.devcontainer/devcontainer.json` so it is explicitly aligned with GitHub Codespaces
- Preserve useful VS Code extensions for Angular and Docker
- Keep the frontend port labeled as Angular UI and auto-open preview

### Result

After opening the repo in Codespaces, the project should be runnable with the same command used locally:

```bash
docker compose up -d
```

This keeps local development and Codespaces development consistent.

## Small But Important Follow-Up

To avoid browser-side CORS and hardcoded localhost issues, the Angular app should call PocketBase using an environment value such as:

- `${FRONTEND_BASE_URL}/api/` when accessed from the browser on the host

If Angular code currently hardcodes a different URL, that should be aligned in the same pass as the compose update.

## Validation Steps

1. Run `docker-compose up --build`.
2. Confirm Angular is reachable on `${FRONTEND_BASE_URL}`.
3. Confirm PocketBase health endpoint responds on `${FRONTEND_BASE_URL}/api/health`.
4. Confirm PocketBase admin UI loads on `${FRONTEND_BASE_URL}/_/`.
5. Confirm Angular can reach PocketBase from the browser.

## Optional Next Improvement

If you want a cleaner setup after the dev version is in place, split into:

- `docker-compose.yml` for development
- `docker-compose.prod.yml` for a production build with Angular compiled once and served statically

That is not required for the MVP dev workflow.
