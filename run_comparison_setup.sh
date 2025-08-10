#!/usr/bin/env bash
set -euo pipefail

# Apply comparison dashboard SQL using Supabase RPC exec_sql
# Requires: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in .env

if [ -f .env ]; then
  source .env
fi

if [ -z "${VITE_SUPABASE_URL:-}" ] || [ -z "${VITE_SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY. Please set them in .env"
  exit 1
fi

SQL_FILE="/workspace/setup_comparison_dashboard.sql"
if [ ! -f "$SQL_FILE" ]; then
  echo "SQL file not found: $SQL_FILE"
  exit 1
fi

payload=$(jq -Rs . < "$SQL_FILE")

curl -s -X POST \
  "$VITE_SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $VITE_SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $payload}" | cat

echo "\nDone."