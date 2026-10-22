#!/bin/sh
# Deploys one commit on the server (Stage 15). Run by .github/workflows/deploy.yml over SSH,
# or by hand on the server:  sh scripts/deploy.sh <40-character commit id>
#
# SECURITY: the GitHub deploy key may run ONLY this script. Its line in ~/.ssh/authorized_keys
# starts with  command="sh /home/ubuntu/apps/urconnections/scripts/deploy.sh",restrict
# so whatever command the client asks for arrives here as $SSH_ORIGINAL_COMMAND, and it is
# accepted only if it is a commit id. A stolen key can redeploy a commit, nothing else.
#
# Two phases, because phase 1 replaces this very file:
#   1. check the commit id, fetch it, check it out (detached: the server runs exactly that commit)
#   2. run the NEW version of this script (`exec … --apply`), which deploys it
set -eu
cd "$(dirname "$0")/.."
dc() { docker compose -f compose.prod.yml --env-file .env.prod "$@"; }

if [ "${1:-}" != "--apply" ]; then
  SHA="${1:-${SSH_ORIGINAL_COMMAND:-}}"
  case "$SHA" in
    "" | *[!0-9a-f]*) echo "deploy: expected a commit id, got '$SHA'" >&2; exit 2 ;;
  esac
  [ ${#SHA} -eq 40 ] || { echo "deploy: expected a 40-character commit id" >&2; exit 2; }

  # One deploy at a time (GitHub queues its own runs; this also covers a deploy by hand).
  # fd 9 stays open across `exec`, so the lock is held until phase 2 ends.
  exec 9>/tmp/urconnections-deploy.lock
  flock -n 9 || { echo "deploy: another deploy is running" >&2; exit 1; }

  OLD=$(git rev-parse HEAD)
  git fetch --quiet origin
  # --force: hand edits to tracked files are thrown away; the server must equal the repo.
  # Ignored files (.env.prod) are never touched.
  git checkout --quiet --force --detach "$SHA"
  exec sh scripts/deploy.sh --apply "$OLD" "$SHA"
fi

OLD="$2"
SHA="$3"
echo "deploy: $OLD -> $SHA"
grep -q '^IMAGE_PREFIX=' .env.prod || { echo "deploy: set IMAGE_PREFIX in .env.prod" >&2; exit 1; }

# 1. A backup before anything changes: new migrations may alter the schema.
dc exec -T backup sh /backup.sh once </dev/null

# 2. Pull the images CI built for this commit. Nothing is built on the server.
#    A variable from the shell wins over .env.prod, so this pulls the NEW tag.
export IMAGE_TAG="$SHA"
dc pull --quiet api web

# 3. Only after a successful pull, record the version in .env.prod: a later manual `dc up`
#    then starts the same images instead of an older tag.
if grep -q '^IMAGE_TAG=' .env.prod; then
  sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$SHA/" .env.prod
else
  echo "IMAGE_TAG=$SHA" >> .env.prod
fi

# 4. Start the new version: migrate runs first, api/web are replaced, --wait = until healthy.
dc up -d --no-build --wait

# 5. Files mounted one by one (Caddyfile, scripts) keep their OLD content inside a running
#    container after git replaces them (a single-file mount points at the old file).
#    Restart the services whose mounted file changed in this deploy, if they run here.
changed=$(git diff --name-only "$OLD" "$SHA")
running=$(dc ps --services --status running)
restart_if_changed() {
  if echo "$changed" | grep -qx "$1" && echo "$running" | grep -qx "$2"; then
    echo "deploy: $1 changed, restarting $2"
    dc restart "$2"
  fi
}
restart_if_changed Caddyfile caddy
restart_if_changed docker/backup/backup.sh backup
restart_if_changed docker/backup/offsite.sh offsite
restart_if_changed docker/garage/garage.toml garage

# 6. Remove images no container uses that are older than a week (each deploy adds two).
#    Rollback to an older commit still works: deploy pulls its images from GHCR again.
docker image prune -af --filter "until=168h" >/dev/null

echo "deploy: $SHA is live"
