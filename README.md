# CV Generator

A self-hosted CV generator built with PocketBase and Angular.

## Architecture

- **Backend**: PocketBase (SQLite + Admin UI)
- **Frontend**: Angular 17+
- **PDF Export**: Browser print

## Quick Start

```bash
docker compose up -d
```

- Frontend: http://localhost:4200
- PocketBase Admin: http://localhost:8090/_/

PocketBase seeds a super admin automatically on startup:

- Email: `admin@cv-generator.local`
- Password: `changeme123!`

Override those defaults with `PB_ADMIN_EMAIL` and `PB_ADMIN_PASSWORD` in your shell or a local `.env` file.

## Development

```bash
# Start the full development stack
docker compose up -d
```

The Angular dev server proxies `/api` requests to PocketBase, so the frontend can use the same API base path locally and in GitHub Codespaces.

## Local MCP

The repository includes a project-level `opencode.json` that points OpenCode at the local MCP endpoint on `http://localhost:8081/mcp`.

### First local setup

```bash
make up
make ensure-mcp-service-user
make mcp-up
```

This flow will:

- ensure a local `.env` exists by copying `.env.example` if needed
- start the Docker stack
- create or reconcile the local PocketBase MCP service user
- start the `mcp` service

After that:

- sign in to the app as the user who owns the CV data
- create an MCP API key from the token management page
- copy that key into `opencode.json`

The committed `opencode.json` should keep an empty `API_KEY` placeholder only.

### Optional preview seed data

```bash
make bootstrap-with-seed
```

Or later:

```bash
make seed
```

The seed import is intentionally fail-fast and will stop if the target collections are not empty.

To remove only the preview seed data without resetting the whole PocketBase instance:

```bash
make clean-seed
```

### Useful commands

```bash
make up
make down
make logs
make ps
make mcp-up
make mcp-down
make mcp-logs
make ensure-mcp-service-user
```

`make up` only starts the stack. It does not run bootstrap side effects.

## Dev Container

The repository includes a Docker-first Codespaces/devcontainer setup that:

- starts the full Docker Compose stack on create
- waits for PocketBase and Angular to become reachable
- forwards `4200` and `8090`
- keeps PocketBase runtime data in a private per-codespace folder at `.local/pocketbase/pb_data`

After the devcontainer starts, you should have:

- Angular: `http://localhost:4200`
- PocketBase Admin: `http://localhost:8090/_/`
- PocketBase API: `http://localhost:8090/api/`

The devcontainer uses `docker-compose.yml` plus `docker-compose.devcontainer.yml`, so the workflow stays close to local Docker development while keeping Codespaces data private and gitignored.

If you need to rerun the bootstrap manually inside the devcontainer:

```bash
bash .devcontainer/setup.sh
```

## Structure

```
├── backend/           # PocketBase (not used, handled by container)
├── pb_data/           # PocketBase SQLite data
├── pb_migrations/     # Database migrations
├── frontend/          # Angular app
└── docker-compose.yml
```
