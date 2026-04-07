# CV Generator

A self-hosted CV generator built with PocketBase and Angular.

## Architecture

- **Backend**: PocketBase (SQLite + Admin UI)
- **Frontend**: Angular 17+
- **PDF Export**: Browser print

## Quick Start

```bash
docker-compose up -d
```

- Frontend: http://localhost:4200
- PocketBase Admin: http://localhost:8090/_/

## Development

```bash
# Start PocketBase only
docker-compose up -d pocketbase

# Start Angular dev server
cd frontend && npm install && ng serve
```

## Structure

```
├── backend/           # PocketBase (not used, handled by container)
├── pb_data/           # PocketBase SQLite data
├── pb_migrations/     # Database migrations
├── frontend/          # Angular app
└── docker-compose.yml
```
