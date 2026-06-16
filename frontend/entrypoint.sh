#!/bin/sh
set -e

# Inject runtime configuration from environment variables at container start.
# This overwrites the placeholder baked in at build time so that
# BUG_REPORT_URL (and any future env-driven values) are applied per-deploy
# without rebuilding the image.
mkdir -p /usr/share/nginx/html/assets

echo "{\"bugReportUrl\": \"${BUG_REPORT_URL:-}\", \"mcpPublicBaseUrl\": \"${MCP_PUBLIC_BASE_URL:-${MCP_BASE_URL:-}}\"}" \
  > /usr/share/nginx/html/assets/runtime-config.json

# Process nginx config templates (substitutes ${POCKETBASE_INTERNAL_PORT}
# and any other env vars referenced in /etc/nginx/templates/*.template).
# The official nginx:alpine image runs this automatically via its entrypoint,
# but since we replace the entrypoint we invoke it manually.
export NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d
for template in /etc/nginx/templates/*.template; do
  output="/etc/nginx/conf.d/$(basename "${template}" .template)"
  envsubst '${POCKETBASE_INTERNAL_PORT}' < "${template}" > "${output}"
done

exec nginx -g 'daemon off;'
