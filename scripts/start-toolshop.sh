#!/usr/bin/env bash
# Starts a self-hosted Toolshop (sprint 5) with Docker Compose and seeds it.
#   UI  → http://localhost:4200
#   API → http://localhost:8091
# Usage: scripts/start-toolshop.sh [path-to-practice-software-testing-checkout]
# Mirrors the upstream project's own CI workflow (testsmith-io/practice-software-testing).
set -euo pipefail
trap 'echo "::error title=start-toolshop.sh::failed at line $LINENO: $BASH_COMMAND"' ERR

APP_DIR="${1:-toolshop}"
export SPRINT=sprint5
export DISABLE_LOGGING=false
# Use only the base compose file (skip the repo's dev override with phpMyAdmin, mailcatcher, …).
export COMPOSE_FILE=docker-compose.yml

if [ ! -d "$APP_DIR" ]; then
  git clone --depth 1 https://github.com/testsmith-io/practice-software-testing "$APP_DIR"
fi
cd "$APP_DIR"

echo "::group::Start containers"
docker compose up -d --force-recreate
echo "::endgroup::"

echo "::group::Install API dependencies"
# The compose file's one-shot `composer` service installs dependencies into the shared volume on
# start-up; wait for it to finish so the explicit install below doesn't race with it.
docker compose wait composer || true
docker compose exec -T -u root laravel-api composer install --no-dev --optimize-autoloader --ignore-platform-req=ext-ffi
# Installing as root leaves Laravel's writable dirs root-owned; PHP-FPM runs as www-data and then
# fails on logging / file cache with HTTP 500s.
docker compose exec -T -u root laravel-api sh -c \
  'mkdir -p storage/logs storage/framework/cache/data storage/framework/sessions storage/framework/views bootstrap/cache \
   && chown -R www-data:www-data storage bootstrap/cache && chmod -R ug+rwX storage bootstrap/cache'
echo "::endgroup::"

echo "::group::Wait for database"
for i in $(seq 1 60); do
  if docker compose exec -T mariadb mysqladmin ping -h localhost -u root -proot --silent 2>/dev/null; then
    echo "MariaDB is ready"
    break
  fi
  sleep 2
done
echo "::endgroup::"

echo "::group::Migrate & seed"
docker compose exec -T laravel-api php artisan migrate:refresh --seed
echo "::endgroup::"

echo "::group::Wait for API and UI"
for i in $(seq 1 60); do
  curl -sf -o /dev/null http://localhost:8091/status && { echo "API is ready"; break; }
  sleep 5
done

# Smoke-check the authenticated API before handing over to the tests and surface the Laravel
# log as a CI annotation when it is unhealthy. Never aborts the script.
smoke_check() {
  local login me
  login=$(curl -s -w ' HTTP%{http_code}' -X POST http://localhost:8091/users/login \
    -H 'Content-Type: application/json' \
    --data '{"email":"customer@practicesoftwaretesting.com","password":"welcome01"}')
  token=$(sed -E 's/.*"access_token":"([^"]+)".*/\1/' <<<"$login")
  me=$(curl -s -w ' HTTP%{http_code}' -H "Authorization: Bearer $token" http://localhost:8091/users/me)
  case "$me" in *HTTP200) echo "API smoke check passed"; return ;; esac
  local log msg
  log=$(docker compose exec -T laravel-api sh -c 'tail -n 40 storage/logs/*.log' 2>&1 | cut -c1-300)
  msg="login: ${login:0:400}"$'\n'"GET /users/me: ${me:0:300}"$'\n'"$log"
  msg="${msg//'%'/'%25'}"; msg="${msg//$'\n'/'%0A'}"; msg="${msg//$'\r'/'%0D'}"
  echo "::warning title=Toolshop API smoke check::$msg"
}
smoke_check || true

# The UI container runs `npm install` + `ng serve` on start, which takes a few minutes.
for i in $(seq 1 120); do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4200)" = "200" ]; then
    echo "UI is ready"
    echo "::endgroup::"
    exit 0
  fi
  sleep 5
done
echo "UI did not start within 10 minutes"
docker compose logs --tail 200 angular-ui
exit 1
