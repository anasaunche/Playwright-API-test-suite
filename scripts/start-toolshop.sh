#!/usr/bin/env bash
# Starts a self-hosted Toolshop (sprint 5) with Docker Compose and seeds it.
#   UI  → http://localhost:4200
#   API → http://localhost:8091
# Usage: scripts/start-toolshop.sh [path-to-practice-software-testing-checkout]
# Mirrors the upstream project's own CI workflow (testsmith-io/practice-software-testing).
set -euo pipefail

APP_DIR="${1:-toolshop}"
export SPRINT=sprint5
export DISABLE_LOGGING=true

if [ ! -d "$APP_DIR" ]; then
  git clone --depth 1 https://github.com/testsmith-io/practice-software-testing "$APP_DIR"
fi
cd "$APP_DIR"

echo "::group::Start containers"
docker compose -f docker-compose.yml up -d --force-recreate
echo "::endgroup::"

echo "::group::Install API dependencies"
for i in $(seq 1 30); do
  docker compose exec -T laravel-api true 2>/dev/null && break
  sleep 2
done
docker compose exec -T -u root laravel-api composer install --no-dev --optimize-autoloader --ignore-platform-req=ext-ffi
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
