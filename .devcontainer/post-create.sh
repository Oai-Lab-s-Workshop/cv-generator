#!/bin/bash
set -e

echo "Starting Docker Compose development stack"
docker compose up -d --build

echo ""
echo "Services"
docker compose ps

echo ""
echo "URLs"
echo "Angular Dev:       http://localhost:4200"
echo "PocketBase Admin:  http://localhost:8090/_/"
echo "PocketBase API:    http://localhost:8090/api/"
