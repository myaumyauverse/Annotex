#!/usr/bin/env bash
#
# Back up the Annotex database and uploaded files.
#
# Usage:
#   bash backup.sh              take a backup now
#   bash backup.sh --restore <dump.sql>
#
# Installed as a nightly systemd timer by ec2-bootstrap.sh. Run it by hand any
# time — before a risky migration, say.
#
# Offsite copies: set S3_BUCKET in .env.production (e.g. S3_BUCKET=my-annotex-backups)
# and install the AWS CLI. Without it, backups stay on this instance's disk,
# which does NOT survive the instance being terminated. See DEPLOYMENT.md.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/Annotex}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/annotex-backups}"
RETAIN_DAYS="${RETAIN_DAYS:-7}"
COMPOSE="docker compose --env-file .env.production -f docker-compose.prod.yml"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
die() { printf '\n\033[1;31mFAILED: %s\033[0m\n' "$1" >&2; exit 1; }

cd "$APP_DIR" 2>/dev/null || die "$APP_DIR not found"
[ -f .env.production ] || die ".env.production not found in $APP_DIR"

PG_USER=$(grep '^POSTGRES_USER=' .env.production | cut -d= -f2)
PG_DB=$(grep '^POSTGRES_DB=' .env.production | cut -d= -f2)
S3_BUCKET=$(grep '^S3_BUCKET=' .env.production 2>/dev/null | cut -d= -f2 || true)
: "${PG_USER:?POSTGRES_USER missing from .env.production}"
: "${PG_DB:?POSTGRES_DB missing from .env.production}"

# ------------------------------------------------------------------ restore
if [ "${1:-}" = "--restore" ]; then
  DUMP="${2:-}"
  [ -f "$DUMP" ] || die "usage: bash backup.sh --restore <dump.sql>"
  say "Restoring $DUMP into $PG_DB"
  echo "    This OVERWRITES current data. Ctrl-C within 10s to abort."
  sleep 10
  # shellcheck disable=SC2086  # COMPOSE is a command with args, must word-split
  sudo $COMPOSE exec -T db psql -U "$PG_USER" -d "$PG_DB" < "$DUMP"
  say "Restored. Restart the backend: sudo $COMPOSE restart backend"
  exit 0
fi

# ------------------------------------------------------------------- backup
mkdir -p "$BACKUP_DIR"
STAMP=$(date +%F-%H%M)
DB_FILE="$BACKUP_DIR/annotex-db-$STAMP.sql.gz"
UP_FILE="$BACKUP_DIR/annotex-uploads-$STAMP.tar.gz"

say "Backing up database"
# shellcheck disable=SC2086
sudo $COMPOSE exec -T db pg_dump -U "$PG_USER" "$PG_DB" | gzip > "$DB_FILE"
[ -s "$DB_FILE" ] || die "database dump is empty — is the db container running?"
echo "    $DB_FILE ($(du -h "$DB_FILE" | cut -f1))"

say "Backing up uploads"
# Tar from inside the backend container, which already has the uploads volume
# mounted. Avoids having to resolve the prefixed Docker volume name.
# shellcheck disable=SC2086
sudo $COMPOSE exec -T backend tar czf - -C /app/uploads . > "$UP_FILE" \
  || die "uploads archive failed — is the backend container running?"
echo "    $UP_FILE ($(du -h "$UP_FILE" | cut -f1))"

# --------------------------------------------------------------- offsite
if [ -n "${S3_BUCKET:-}" ]; then
  if command -v aws >/dev/null; then
    say "Uploading to s3://$S3_BUCKET"
    aws s3 cp "$DB_FILE" "s3://$S3_BUCKET/" --only-show-errors
    aws s3 cp "$UP_FILE" "s3://$S3_BUCKET/" --only-show-errors
    echo "    done"
  else
    echo "    S3_BUCKET is set but the AWS CLI is not installed; skipping offsite copy"
  fi
else
  echo
  echo "    NOTE: local-only backup. If this instance is terminated these go"
  echo "    with it. Set S3_BUCKET in .env.production for offsite copies."
fi

# ------------------------------------------------------------- retention
say "Pruning backups older than $RETAIN_DAYS days"
find "$BACKUP_DIR" -name 'annotex-*' -type f -mtime "+$RETAIN_DAYS" -print -delete

say "Done"
du -sh "$BACKUP_DIR" | sed 's/^/    total: /'
