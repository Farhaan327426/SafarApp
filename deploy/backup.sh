#!/bin/bash
# ─── SAFAR — Automated SQLite Backup Script ─────────────────────────────────────
# Runs every 15 minutes via cron:
#   */15 * * * * /opt/safar/backup.sh >> /var/log/safar/backup.log 2>&1
#
# Prerequisites:
#   - sqlite3 CLI installed
#   - gpg key stored at /opt/safar/.backup-key
#   - (Optional) b2 CLI for Backblaze B2 cloud uploads
# ─────────────────────────────────────────────────────────────────────────────────

set -euo pipefail

DB_PATH="/var/www/safar/command-control-server/data/safar.db"
BACKUP_DIR="/opt/safar/backups"
MAX_LOCAL_BACKUPS=48   # 48 × 15min = 12 hours of local retention
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="safar_${TIMESTAMP}.db"

# Optional: Backblaze B2 bucket name (set to empty to skip cloud upload)
B2_BUCKET=""
# Optional: GPG passphrase file for encryption (set to empty to skip encryption)
GPG_KEY_FILE="/opt/safar/.backup-key"

echo "────────────────────────────────────────"
echo "[$(date)] Starting SAFAR backup..."

# 1. Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# 2. Verify source database exists
if [ ! -f "$DB_PATH" ]; then
    echo "ERROR: Database not found at $DB_PATH"
    exit 1
fi

# 3. Hot backup using SQLite .backup API (safe with WAL mode)
sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/$BACKUP_FILE'"
echo "  ✓ Database backed up: $BACKUP_FILE ($(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1))"

# 4. Encrypt backup (if GPG key exists)
if [ -n "$GPG_KEY_FILE" ] && [ -f "$GPG_KEY_FILE" ]; then
    gpg --symmetric --batch --yes --passphrase-file "$GPG_KEY_FILE" \
        "$BACKUP_DIR/$BACKUP_FILE"
    rm "$BACKUP_DIR/$BACKUP_FILE"  # Remove unencrypted
    BACKUP_FILE="${BACKUP_FILE}.gpg"
    echo "  ✓ Encrypted: $BACKUP_FILE"
fi

# 5. Upload to cloud storage (if B2 configured)
if [ -n "$B2_BUCKET" ]; then
    b2 upload-file "$B2_BUCKET" "$BACKUP_DIR/$BACKUP_FILE" \
        "backups/$BACKUP_FILE" > /dev/null 2>&1
    echo "  ✓ Uploaded to B2: $B2_BUCKET/backups/$BACKUP_FILE"
fi

# 6. Rotate local backups (keep last N)
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/ 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_LOCAL_BACKUPS" ]; then
    ls -t "$BACKUP_DIR"/* | tail -n +$((MAX_LOCAL_BACKUPS + 1)) | xargs -r rm
    DELETED=$((BACKUP_COUNT - MAX_LOCAL_BACKUPS))
    echo "  ✓ Rotated: removed $DELETED old backup(s)"
fi

echo "[$(date)] Backup complete."
echo "────────────────────────────────────────"
