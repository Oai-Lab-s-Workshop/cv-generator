#!/bin/bash
set -e

echo "Starting PocketBase and frontend proxy..."
docker-compose up -d pocketbase frontend

echo "Waiting for services to be ready..."
sleep 3

echo ""
FRONTEND_PORT="${FRONTEND_PORT:-4200}"
PB_URL="${PB_URL:-http://localhost:${FRONTEND_PORT}}"

echo "PocketBase is internal to Docker. Use the frontend proxy: ${PB_URL}/api/"
echo "Admin UI: ${PB_URL}/_/"
echo ""
echo "Frontend proxy started by Docker Compose."
echo ""
