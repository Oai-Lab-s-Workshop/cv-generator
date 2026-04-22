SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

HELPERS := scripts/make_helpers.sh
SEED_USER_EMAIL := alexandre.cv@gmail.com

.PHONY: env-init up down logs ps mcp-up mcp-down mcp-logs wait-pocketbase bootstrap bootstrap-with-seed seed clean-seed ensure-mcp-service-user

env-init:
	source "$(HELPERS)"; \
	ensure_env_file; \
	echo "Ensured .env exists."

up: env-init
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

ps:
	docker compose ps

mcp-up: env-init
	docker compose up -d mcp

mcp-down:
	docker compose stop mcp

mcp-logs:
	docker compose logs -f mcp

wait-pocketbase: env-init
	source "$(HELPERS)"; \
	load_env_file; \
	for attempt in $$(seq 1 120); do \
	  if curl -fsS "$$PB_URL/api/health" > /dev/null 2>&1; then \
	    echo "PocketBase is healthy at $$PB_URL."; \
	    exit 0; \
	  fi; \
	  sleep 1; \
	done; \
	echo "PocketBase at $$PB_URL did not become healthy in time." >&2; \
	exit 1

bootstrap: env-init up wait-pocketbase ensure-mcp-service-user mcp-up

bootstrap-with-seed: bootstrap seed

ensure-mcp-service-user: env-init wait-pocketbase
	source "$(HELPERS)"; \
	load_env_file; \
	token="$$(pb_admin_token)"; \
	service_email="$$POCKETBASE_SERVICE_USER_EMAIL"; \
	service_password="$${POCKETBASE_SERVICE_USER_PASSWORD:-$$(random_secret 18)}"; \
	existing_id="$$(pb_find_first_id "$$token" users "email=\"$$service_email\"")"; \
	body="$$(jq -cn \
	  --arg email "$$service_email" \
	  --arg password "$$service_password" \
	  --arg firstName 'MCP' \
	  --arg lastName 'Service' \
	  '{email: $$email, password: $$password, passwordConfirm: $$password, verified: true, emailVisibility: false, firstName: $$firstName, lastName: $$lastName, name: ($$firstName + " " + $$lastName), isMcpServiceAccount: true}')"; \
	if [ -n "$$existing_id" ]; then \
	  pb_patch_record "$$token" users "$$existing_id" "$$body"; \
	  resolved_email="$$service_email"; \
	else \
	  response="$$(pb_create_record "$$token" users "$$body")"; \
	  resolved_email="$$(printf '%s' "$$response" | jq -r '.email')"; \
	fi; \
	write_env_value POCKETBASE_SERVICE_USER_EMAIL "$$resolved_email"; \
	write_env_value POCKETBASE_SERVICE_USER_PASSWORD "$$service_password"; \
	echo "Ensured MCP service user $$resolved_email exists."

seed: env-init wait-pocketbase
	source "$(HELPERS)"; \
	load_env_file; \
	PB_URL="$$PB_URL" \
	PB_ADMIN_EMAIL="$$PB_ADMIN_EMAIL" \
	PB_ADMIN_PASSWORD="$$PB_ADMIN_PASSWORD" \
	SEED_USER_PASSWORD="$$RESUMATE_DEMO_USER_PASSWORD" \
	node scripts/import_seed_via_api.js

clean-seed: env-init wait-pocketbase
	source "$(HELPERS)"; \
	load_env_file; \
	token="$$(pb_admin_token)"; \
	seeded_user_id="$$(pb_find_first_id "$$token" users "email=\"$(SEED_USER_EMAIL)\"")"; \
	if [ -z "$$seeded_user_id" ]; then \
	  echo 'No seeded preview data found.'; \
	  exit 0; \
	fi; \
	for collection in cv_profiles jobs projects achievements degrees hobbies skills; do \
	  while IFS= read -r record_id; do \
	    [ -n "$$record_id" ] || continue; \
	    pb_delete_record "$$token" "$$collection" "$$record_id"; \
	  done < <(pb_list_ids "$$token" "$$collection" "user=\"$$seeded_user_id\""); \
	done; \
	pb_delete_record "$$token" users "$$seeded_user_id"; \
	echo 'Removed seeded preview data.'
