#!/bin/sh
# Nightly database backup, run by the "backup" service in compose.prod.yml.
#
# pg_dump writes a consistent snapshot of the whole database while the site keeps running.
# Custom format (-Fc) is compressed and restored with pg_restore:
#   pg_restore --clean --if-exists -d urconnections /backups/<file>.dump
# Backups older than BACKUP_KEEP_DAYS are deleted. offsite.sh copies them off the server
# (a backup on the same disk doesn't survive that disk dying).
# Connection settings come from PGHOST / PGUSER / PGPASSWORD / PGDATABASE (compose.prod.yml).
#
#   backup.sh        run forever: a backup now, then one every 24 hours (the service)
#   backup.sh once   one backup, then exit (npm run prod:backup, e.g. right before a deploy)
set -u
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"

backup_once() {
  file="/backups/urconnections-$(date -u +%Y%m%d-%H%M%S).dump"
  # Write to .tmp first and rename only on success: a half-written file is never a "backup".
  if pg_dump --format=custom --no-owner --file="$file.tmp"; then
    mv "$file.tmp" "$file"
    echo "backup: wrote $file ($(du -h "$file" | cut -f1))"
  else
    rm -f "$file.tmp"
    echo "backup: FAILED" >&2
    return 1
  fi
  find /backups -name 'urconnections-*.dump' -mtime +"$KEEP_DAYS" -delete
}

if [ "${1:-}" = "once" ]; then
  backup_once
  exit $?
fi

while true; do
  backup_once || echo "backup: will retry in 24h" >&2
  sleep 86400
done
