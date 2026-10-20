#!/bin/sh
# Off-site copies of the database backups, run by the "offsite" service in compose.prod.yml
# (Stage 14). A backup on the same disk dies with that disk, the server, or the data center,
# so every dump is also copied to object storage at another company (Cloudflare R2: S3 API).
#
# rclone reads its "r2" remote from RCLONE_CONFIG_R2_* environment variables (no config file).
# `rclone copy` only uploads files the bucket doesn't have yet, so running it often is cheap.
# It never deletes in the bucket because a file disappeared here: if the server is wiped or
# broken into, the off-site copies stay. Old copies are pruned by age instead (OFFSITE_KEEP_DAYS).
#
#   offsite.sh        run forever: copy now, then every 6 hours (the service)
#   offsite.sh once   copy once, then exit (e.g. right after `backup.sh once`)
set -u
KEEP_DAYS="${OFFSITE_KEEP_DAYS:-30}"

if [ -z "${OFFSITE_S3_BUCKET:-}" ] || [ -z "${RCLONE_CONFIG_R2_ACCESS_KEY_ID:-}" ] || [ -z "${RCLONE_CONFIG_R2_ENDPOINT:-}" ]; then
  echo "offsite: OFFSITE_S3_ENDPOINT / OFFSITE_S3_BUCKET / OFFSITE_S3_ACCESS_KEY_ID are not set in .env.prod" >&2
  exit 1
fi
REMOTE="r2:$OFFSITE_S3_BUCKET"

copy_once() {
  if rclone copy /backups "$REMOTE" --include 'urconnections-*.dump' --stats-one-line --stats 0; then
    echo "offsite: copied to $REMOTE ($(rclone lsf "$REMOTE" --include 'urconnections-*.dump' | wc -l) dumps there)"
  else
    echo "offsite: FAILED" >&2
    return 1
  fi
  rclone delete "$REMOTE" --include 'urconnections-*.dump' --min-age "${KEEP_DAYS}d"
}

if [ "${1:-}" = "once" ]; then
  copy_once
  exit $?
fi

while true; do
  copy_once || echo "offsite: will retry in 6h" >&2
  sleep 21600
done
