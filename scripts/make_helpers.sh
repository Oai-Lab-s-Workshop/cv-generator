#!/bin/bash

ENV_FILE=.env
ENV_EXAMPLE=.env.example
PB_URL_DEFAULT=http://localhost:8090
PB_ADMIN_EMAIL_DEFAULT=admin@cv-generator.local
PB_ADMIN_PASSWORD_DEFAULT=changeme123!
FRONTEND_BASE_URL_DEFAULT=http://localhost:4200
POCKETBASE_SERVICE_USER_EMAIL_DEFAULT=mcp-service@cv-generator.local
RESUMATE_DEMO_USER_EMAIL_DEFAULT=ai-demo@cv-generator.local
RESUMATE_DEMO_USER_PASSWORD_DEFAULT=changeme123!

ensure_env_file() {
  if [ ! -f "$ENV_FILE" ]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
  fi
}

load_env_file() {
  ensure_env_file
  set -a
  source "$ENV_FILE"
  set +a
  : "${PB_URL:=$PB_URL_DEFAULT}"
  : "${PB_ADMIN_EMAIL:=$PB_ADMIN_EMAIL_DEFAULT}"
  : "${PB_ADMIN_PASSWORD:=$PB_ADMIN_PASSWORD_DEFAULT}"
  : "${FRONTEND_BASE_URL:=$FRONTEND_BASE_URL_DEFAULT}"
  : "${POCKETBASE_SERVICE_USER_EMAIL:=$POCKETBASE_SERVICE_USER_EMAIL_DEFAULT}"
  : "${RESUMATE_DEMO_USER_EMAIL:=$RESUMATE_DEMO_USER_EMAIL_DEFAULT}"
  : "${RESUMATE_DEMO_USER_PASSWORD:=$RESUMATE_DEMO_USER_PASSWORD_DEFAULT}"
}

write_env_value() {
  local key="$1"
  local value="$2"
  local tmp_file
  ensure_env_file
  tmp_file="$(mktemp)"
  awk -v key="$key" -v value="$value" '
    BEGIN { updated = 0 }
    index($0, key "=") == 1 { print key "=" value; updated = 1; next }
    { print }
    END { if (!updated) print key "=" value }
  ' "$ENV_FILE" > "$tmp_file"
  mv "$tmp_file" "$ENV_FILE"
}

pb_admin_token() {
  local response
  local token
  response="$(curl -fsS -X POST "$PB_URL/api/collections/_superusers/auth-with-password" \
    -H 'Content-Type: application/json' \
    --data "$(jq -cn --arg identity "$PB_ADMIN_EMAIL" --arg password "$PB_ADMIN_PASSWORD" '{identity: $identity, password: $password}')")"
  token="$(printf '%s' "$response" | jq -r '.token // empty')"
  if [ -z "$token" ]; then
    echo 'PocketBase admin authentication failed.' >&2
    return 1
  fi
  printf '%s' "$token"
}

pb_find_first_id() {
  local token="$1"
  local collection="$2"
  local filter="$3"
  curl -fsS -G "$PB_URL/api/collections/$collection/records" \
    -H "Authorization: $token" \
    --data-urlencode 'page=1' \
    --data-urlencode 'perPage=1' \
    --data-urlencode "filter=$filter" | jq -r '.items[0].id // empty'
}

pb_list_ids() {
  local token="$1"
  local collection="$2"
  local filter="$3"
  curl -fsS -G "$PB_URL/api/collections/$collection/records" \
    -H "Authorization: $token" \
    --data-urlencode 'page=1' \
    --data-urlencode 'perPage=500' \
    --data-urlencode "filter=$filter" | jq -r '.items[].id'
}

pb_create_record() {
  local token="$1"
  local collection="$2"
  local body="$3"
  curl -fsS -X POST "$PB_URL/api/collections/$collection/records" \
    -H "Authorization: $token" \
    -H 'Content-Type: application/json' \
    --data "$body"
}

pb_patch_record() {
  local token="$1"
  local collection="$2"
  local record_id="$3"
  local body="$4"
  curl -fsS -X PATCH "$PB_URL/api/collections/$collection/records/$record_id" \
    -H "Authorization: $token" \
    -H 'Content-Type: application/json' \
    --data "$body" > /dev/null
}

pb_delete_record() {
  local token="$1"
  local collection="$2"
  local record_id="$3"
  curl -fsS -X DELETE "$PB_URL/api/collections/$collection/records/$record_id" \
    -H "Authorization: $token" > /dev/null
}

random_secret() {
  local bytes="$1"
  openssl rand -hex "$bytes"
}

sha256_hex() {
  printf '%s' "$1" | shasum -a 256 | awk '{ print $1 }'
}
