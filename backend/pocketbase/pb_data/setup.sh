#!/bin/sh
# PocketBase auto-setup script
# This runs on first startup to create admin user

ADMIN_EMAIL="${POCKETBASE_ADMIN_EMAIL:-${PB_ADMIN_EMAIL:-}}"
ADMIN_PASSWORD="${POCKETBASE_ADMIN_PASSWORD:-${PB_ADMIN_PASSWORD:-}}"
POCKETBASE_PORT="${POCKETBASE_PORT:-8090}"
PB_URL="${PB_URL:-http://localhost:${POCKETBASE_PORT}}"

# Wait for PocketBase to be ready
sleep 2

if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
  echo "PocketBase admin setup skipped: POCKETBASE_ADMIN_EMAIL/PB_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD/PB_ADMIN_PASSWORD are required."
  exit 1
fi

# Create admin user if it doesn't exist
curl -s -X POST "${PB_URL}/api/admins" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\",\"passwordConfirm\":\"$ADMIN_PASSWORD\"}" \
  2>/dev/null || echo "Admin user already exists or creation failed"

echo "PocketBase setup complete"
