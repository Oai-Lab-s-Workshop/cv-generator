#!/bin/bash
set -euo pipefail

mkdir -p .local/pocketbase/pb_data

echo "Starting Docker Compose development stack"
docker compose -f docker-compose.yml -f docker-compose.devcontainer.yml up -d --build

echo "Waiting for PocketBase..."
for i in {1..20}; do
  if curl -fsS "http://localhost:8090/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "Waiting for Angular dev server..."
for i in {1..30}; do
  if curl -fsS "http://localhost:4200" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "Waiting for preview seed asset..."
for i in {1..20}; do
  if curl -fsS "http://localhost:4200/app-data/seed.json" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo ""
echo "Services"
docker compose -f docker-compose.yml -f docker-compose.devcontainer.yml ps

echo ""
echo "URLs"
echo "Angular Dev:       http://localhost:4200"
echo "Preview Seed:      http://localhost:4200/app-data/seed.json"
echo "PocketBase Admin:  http://localhost:8090/_/"
echo "PocketBase API:    http://localhost:8090/api/"
echo "PocketBase Data:   .local/pocketbase/pb_data"
echo ""
echo "PocketBase super admin"
echo "Email:    ${PB_ADMIN_EMAIL:-admin@cv-generator.local}"
echo "Password: ${PB_ADMIN_PASSWORD:-changeme123!}"
