#!/usr/bin/env bash

set -euo pipefail

HELPERS="scripts/make_helpers.sh"

if [ ! -f "$HELPERS" ]; then
  echo "Run this script from the repository root." >&2
  exit 1
fi

source "$HELPERS"
load_env_file

service_password="${POCKETBASE_SERVICE_USER_PASSWORD:-$(random_secret 18)}"
owner_email="mcp-smoke-owner-$$@resumate.local"
owner_password="$(random_secret 18)"
profile_id=""
owner_id=""

cleanup() {
  local token
  token="$(pb_admin_token 2>/dev/null || true)"
  if [ -z "$token" ]; then
    return
  fi

  if [ -n "$profile_id" ]; then
    pb_delete_record "$token" cv_profiles "$profile_id" 2>/dev/null || true
  fi

  if [ -n "$owner_id" ]; then
    pb_delete_record "$token" users "$owner_id" 2>/dev/null || true
  fi
}
trap cleanup EXIT

for attempt in $(seq 1 120); do
  if curl -fsS "$PB_URL/api/health" >/dev/null 2>&1; then
    break
  fi

  if [ "$attempt" = "120" ]; then
    echo "PocketBase did not become healthy at $PB_URL." >&2
    exit 1
  fi

  sleep 1
done

admin_token="$(pb_admin_token)"

service_id="$(pb_find_first_id "$admin_token" users "email=\"$POCKETBASE_SERVICE_USER_EMAIL\"")"
service_body="$(jq -cn \
  --arg email "$POCKETBASE_SERVICE_USER_EMAIL" \
  --arg password "$service_password" \
  '{email: $email, password: $password, passwordConfirm: $password, verified: true, emailVisibility: false, firstName: "MCP", lastName: "Service", name: "MCP Service", isMcpServiceAccount: true}')"

if [ -n "$service_id" ]; then
  pb_patch_record "$admin_token" users "$service_id" "$service_body"
else
  pb_create_record "$admin_token" users "$service_body" >/dev/null
fi

owner_body="$(jq -cn \
  --arg email "$owner_email" \
  --arg password "$owner_password" \
  '{email: $email, password: $password, passwordConfirm: $password, verified: true, emailVisibility: false, firstName: "Smoke", lastName: "Owner", name: "Smoke Owner"}')"
owner_id="$(pb_create_record "$admin_token" users "$owner_body" | jq -r '.id')"

service_auth="$(curl -fsS -X POST "$PB_URL/api/collections/users/auth-with-password" \
  -H 'Content-Type: application/json' \
  --data "$(jq -cn --arg identity "$POCKETBASE_SERVICE_USER_EMAIL" --arg password "$service_password" '{identity: $identity, password: $password}')")"
service_token="$(printf '%s' "$service_auth" | jq -r '.token // empty')"

if [ -z "$service_token" ]; then
  echo 'MCP service user authentication failed.' >&2
  exit 1
fi

slug="classic--mcp-smoke-$(date +%s)-$$"
profile_body="$(jq -cn \
  --arg slug "$slug" \
  --arg ownerId "$owner_id" \
  '{slug: $slug, label: "MCP Smoke - Classic", profileName: "MCP Smoke Profile", template: "classic", public: true, user: $ownerId, professionalSummary: "Smoke test profile.", skills: [], jobs: [], projects: [], achievements: [], degrees: [], hobbies: [], extra: {}}')"
profile_response="$(curl -fsS -X POST "$PB_URL/api/collections/cv_profiles/records" \
  -H "Authorization: Bearer $service_token" \
  -H 'Content-Type: application/json' \
  --data "$profile_body")"

profile_id="$(printf '%s' "$profile_response" | jq -r '.id // empty')"

if [ -z "$profile_id" ]; then
  echo 'Smoke profile creation did not return an id.' >&2
  printf '%s\n' "$profile_response" >&2
  exit 1
fi

printf '%s' "$profile_response" | jq -e \
  '.label == "MCP Smoke - Classic" and .profileName == "MCP Smoke Profile" and .template == "classic" and .public == true and .user != ""' \
  >/dev/null

echo "PocketBase MCP smoke profile created successfully: $profile_id"
