#!/bin/bash
set -e

echo "Starting PocketBase..."
docker-compose up -d pocketbase

echo "Waiting for PocketBase to be ready..."
sleep 3

echo ""
echo "PocketBase running at: http://localhost:8090"
echo "Admin UI: http://localhost:8090/_/"
echo ""
echo "To start Angular dev server:"
echo "  cd frontend && npm install && npm start"
echo ""
