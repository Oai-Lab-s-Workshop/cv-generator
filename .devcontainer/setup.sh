#!/bin/bash
set -e

echo "=== CV Generator Setup ==="

# Install Angular CLI
npm install -g @angular/cli@latest

# Install frontend dependencies
cd /workspaces/cv-generator/frontend
npm install

# Start PocketBase
cd /workspaces/cv-generator
docker compose up -d pocketbase

echo ""
echo "PocketBase: http://localhost:8090"
echo "PocketBase Admin: http://localhost:8090/_/"
echo "Admin: admin@cv-generator.local / changeme123"
echo ""
echo "To start Angular: cd frontend && npm start"
echo "Angular will be at: http://localhost:4200"
