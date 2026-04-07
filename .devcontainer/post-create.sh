#!/bin/bash
set -e

echo "=== CV Generator Setup ==="
echo ""

# Install Angular CLI globally
npm install -g @angular/cli@latest

# Install frontend dependencies
cd /workspaces/cv-generator/frontend
npm install

# Start Docker Compose
cd /workspaces/cv-generator
docker compose up -d pocketbase

echo ""
echo "=== Services Starting ==="
echo "Waiting for PocketBase..."
sleep 5

# Check if PocketBase is running
if curl -s http://localhost:8090/api/health > /dev/null 2>&1; then
    echo "✓ PocketBase is running"
else
    echo "⚠ PocketBase not responding, check logs: docker compose logs"
fi

echo ""
echo "=== Access URLs ==="
echo "PocketBase Admin: http://localhost:8090/_/"
echo "PocketBase API:    http://localhost:8090/api/"
echo "Angular Dev:       http://localhost:4200"
echo ""
echo "To start Angular: cd frontend && npm start"
