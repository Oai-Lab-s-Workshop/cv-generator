#!/bin/sh
# PocketBase auto-setup script
# This runs on first startup to create admin user

ADMIN_EMAIL="${POCKETBASE_ADMIN_EMAIL:-admin@cv-generator.local}"
ADMIN_PASSWORD="${POCKETBASE_ADMIN_PASSWORD:-changeme123}"

# Wait for PocketBase to be ready
sleep 2

# Create admin user if it doesn't exist
curl -s -X POST http://localhost:8090/api/admins \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\",\"passwordConfirm\":\"$ADMIN_PASSWORD\"}" \
  2>/dev/null || echo "Admin user already exists or creation failed"

echo "PocketBase setup complete"
