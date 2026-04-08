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
