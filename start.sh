#!/bin/bash
set -e

echo "Starting PocketBase..."
docker-compose up -d pocketbase

echo "Waiting for PocketBase to be ready..."
sleep 3

echo ""
POCKETBASE_PORT="${POCKETBASE_PORT:-8090}"
PB_URL="${PB_URL:-http://localhost:${POCKETBASE_PORT}}"

echo "PocketBase running at: ${PB_URL}"
echo "Admin UI: ${PB_URL}/_/"
echo ""
echo "To start Angular dev server:"
echo "  cd frontend && npm install && npm start"
echo ""
