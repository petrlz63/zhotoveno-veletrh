#!/usr/bin/env sh
set -eu

fail() { printf '%s\n' "preflight failed: $*" >&2; exit 1; }

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repo_root"
env_file=${FAIR_ENV_FILE:-/srv/zhotoveno-veletrh/shared/env/veletrh.env}
data_dir=${FAIR_DATA_DIR:-/srv/zhotoveno-veletrh/shared/data}

[ -n "${DEPLOY_SHA:-}" ] || fail "DEPLOY_SHA is required"
printf '%s' "$DEPLOY_SHA" | grep -Eq '^[0-9a-f]{40}$' || fail "DEPLOY_SHA must be a full lowercase SHA"
[ "$DEPLOY_SHA" = "$(git rev-parse HEAD)" ] || fail "DEPLOY_SHA must match HEAD"
[ -z "$(git status --porcelain)" ] || fail "working tree must be clean"
[ -f "$env_file" ] || fail "env file does not exist"

has_value() {
  key=$1
  value=$(grep -E "^[[:space:]]*(export[[:space:]]+)?${key}=" "$env_file" | tail -n 1 | cut -d= -f2- | tr -d '[:space:]' || true)
  [ -n "$value" ] && [ "$value" != '""' ] && [ "$value" != "''" ]
}

for key in FAIR_EVENT_NAME FAIR_ORIGIN FAIR_IP_HASH_SECRET FAIR_ADMIN_KEY_HASH FAIR_ADMIN_SESSION_SECRET BREVO_API_KEY BREVO_SENDER_EMAIL BREVO_SENDER_NAME NEXT_PUBLIC_ZHOTOVENO_WEB_URL NEXT_PUBLIC_APP_STORE_URL NEXT_PUBLIC_GOOGLE_PLAY_URL NEXT_PUBLIC_PRIVACY_URL; do
  has_value "$key" || fail "$key must be present and non-empty in env file"
done

grep -Eq '^[[:space:]]*(export[[:space:]]+)?ZHOTOVENO_MOCK_EMAILS=1([[:space:]]|$)' "$env_file" && fail "ZHOTOVENO_MOCK_EMAILS must not be enabled in production" || true

docker network inspect proxy >/dev/null 2>&1 || fail "external Docker network proxy does not exist"
[ -d "$data_dir" ] || fail "data dir does not exist"
[ "$(stat -c '%u' "$data_dir" 2>/dev/null || stat -f '%u' "$data_dir")" = "1001" ] || fail "data dir must be owned by UID 1001"
[ -w "$data_dir" ] || fail "data dir must be writable"
printf '%s\n' "preflight: deploy inputs are valid"
