#!/bin/bash
set -euo pipefail

mkdir -p .local/pocketbase/pb_data

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

POCKETBASE_PORT="${POCKETBASE_PORT:-8090}"
POCKETBASE_INTERNAL_PORT="${POCKETBASE_INTERNAL_PORT:-8090}"
FRONTEND_PORT="${FRONTEND_PORT:-4200}"
FRONTEND_INTERNAL_PORT="${FRONTEND_INTERNAL_PORT:-4200}"
MCP_PORT="${MCP_PORT:-8081}"
MCP_INTERNAL_PORT="${MCP_INTERNAL_PORT:-8081}"
PB_URL="${PB_URL:-http://localhost:${POCKETBASE_PORT}}"
FRONTEND_BASE_URL="${FRONTEND_BASE_URL:-http://localhost:${FRONTEND_PORT}}"
MCP_BASE_URL="${MCP_BASE_URL:-http://localhost:${MCP_PORT}}"

export POCKETBASE_PORT POCKETBASE_INTERNAL_PORT FRONTEND_PORT FRONTEND_INTERNAL_PORT MCP_PORT MCP_INTERNAL_PORT
export PB_URL FRONTEND_BASE_URL MCP_BASE_URL

echo "Starting Docker Compose development stack"
docker compose -f docker-compose.yml -f docker-compose.devcontainer.yml up -d --build

echo "Waiting for PocketBase..."
for i in {1..20}; do
  if curl -fsS "${PB_URL}/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "Waiting for Angular dev server..."
for i in {1..30}; do
  if curl -fsS "${FRONTEND_BASE_URL}" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "Waiting for preview seed asset..."
for i in {1..20}; do
  if curl -fsS "${FRONTEND_BASE_URL}/app-data/seed.json" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo ""
echo "Services"
docker compose -f docker-compose.yml -f docker-compose.devcontainer.yml ps

echo ""
echo "URLs"
echo "Angular Dev:       ${FRONTEND_BASE_URL}"
echo "Preview Seed:      ${FRONTEND_BASE_URL}/app-data/seed.json"
echo "PocketBase Admin:  ${PB_URL}/_/"
echo "PocketBase API:    ${PB_URL}/api/"
echo "MCP Server:         ${MCP_BASE_URL}/mcp"
echo "PocketBase Data:   .local/pocketbase/pb_data"
echo ""
echo "PocketBase super admin"
echo "Email:    ${PB_ADMIN_EMAIL:-<not configured>}"
echo "Password: ${PB_ADMIN_PASSWORD:+<configured>}"
