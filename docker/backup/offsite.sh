#!/bin/sh
# Off-site copies, run by the "offsite" service in compose.prod.yml (Stage 14; avatars Stage 16).
# A backup on the same disk dies with that disk, the server, or the data center, so everything
# is also copied to object storage at another company (Cloudflare R2: S3 API).
#
# rclone reads its remotes from RCLONE_CONFIG_<NAME>_* environment variables (no config file):
#   r2      the off-site bucket
#   garage  our own file storage (the avatars), read through its S3 API inside Docker's network
#
# What lands in the R2 bucket:
#   urconnections-*.dump        database dumps. `rclone copy` only adds: it never deletes in the
#                               bucket because a dump disappeared here. Pruned by age instead.
#   storage/<key>               a mirror of the storage bucket (avatars/<user>/<id>.webp).
#   storage-removed/<time>/...  objects that were removed from storage (a replaced or deleted
#                               avatar, or everything, if the server was wiped or broken into).
#                               `--backup-dir` moves them here instead of deleting them, and
#                               they're kept OFFSITE_KEEP_DAYS, like the dumps.
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
STORAGE="garage:${STORAGE_BUCKET:-urconnections}"

copy_dumps() {
  if rclone copy /backups "$REMOTE" --include 'urconnections-*.dump' --stats-one-line --stats 0; then
    echo "offsite: copied to $REMOTE ($(rclone lsf --files-only "$REMOTE" --include 'urconnections-*.dump' | wc -l) dumps there)"
  else
    echo "offsite: dumps FAILED" >&2
    return 1
  fi
  # --max-depth 1: dumps live at the top; never look inside storage/ or storage-removed/.
  rclone delete "$REMOTE" --include 'urconnections-*.dump' --min-age "${KEEP_DAYS}d" --max-depth 1
}

copy_storage() {
  stamp=$(date -u +%Y%m%d-%H%M%S)
  # sync = make storage/ equal to the bucket. What it would delete goes to storage-removed/<stamp>.
  if rclone sync "$STORAGE" "$REMOTE/storage" --backup-dir "$REMOTE/storage-removed/$stamp" --stats-one-line --stats 0; then
    echo "offsite: storage mirrored to $REMOTE/storage ($(rclone lsf -R --files-only "$REMOTE/storage" | wc -l) files)"
  else
    echo "offsite: storage FAILED" >&2
    return 1
  fi
  # Prune by the folder's name (the time of removal), not by file age: a picture uploaded long
  # ago but removed today must still be kept for KEEP_DAYS from today.
  cutoff=$(date -u -d "@$(( $(date +%s) - KEEP_DAYS * 86400 ))" +%Y%m%d-%H%M%S)
  rclone lsf --dirs-only "$REMOTE/storage-removed" 2>/dev/null | while read -r dir; do
    dir="${dir%/}"
    if [ "$dir" \< "$cutoff" ]; then rclone purge "$REMOTE/storage-removed/$dir" </dev/null; fi
  done
}

copy_once() {
  status=0
  copy_dumps || status=1
  copy_storage || status=1 # independent: a storage problem never stops the database copy
  return $status
}

if [ "${1:-}" = "once" ]; then
  copy_once
  exit $?
fi

while true; do
  copy_once || echo "offsite: will retry in 6h" >&2
  sleep 21600
done
