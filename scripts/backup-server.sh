#!/bin/bash
#
# BrewOS Server Backup Script
#
# Creates a backup of the database and configuration.
#
# Usage:
#   ./scripts/backup-server.sh [--output /path/to/backup.tar.gz]
#

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# Default backup location
BACKUP_DIR="/root/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="brewos_backup_${TIMESTAMP}.tar.gz"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --output)
            BACKUP_FILE="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# Create backup directory
mkdir -p "$BACKUP_DIR"

log_info "Creating BrewOS backup..."

# Create temp directory for backup contents
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Backup database from Docker volume
log_info "Backing up database..."
docker run --rm \
    -v brewos_brewos-data:/data:ro \
    -v "$TEMP_DIR:/backup" \
    alpine sh -c "cp -a /data/. /backup/data/"

# Backup environment files
log_info "Backing up configuration..."
mkdir -p "$TEMP_DIR/config"
cp /root/brewos/src/web/.env "$TEMP_DIR/config/web.env" 2>/dev/null || true
cp /root/brewos/src/cloud/.env "$TEMP_DIR/config/cloud.env" 2>/dev/null || true
cp /etc/caddy/Caddyfile "$TEMP_DIR/config/Caddyfile" 2>/dev/null || true

# Add metadata
cat > "$TEMP_DIR/backup_info.json" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "hostname": "$(hostname)",
    "brewos_version": "$(cd /root/brewos && git describe --tags --always 2>/dev/null || echo 'unknown')",
    "docker_version": "$(docker --version)"
}
EOF

# Create compressed archive
log_info "Creating archive..."
tar -czf "$BACKUP_DIR/$BACKUP_FILE" -C "$TEMP_DIR" .

# Calculate size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)

log_success "Backup created: $BACKUP_DIR/$BACKUP_FILE ($BACKUP_SIZE)"

# Keep only last 7 backups
log_info "Cleaning old backups (keeping last 7)..."
ls -t "$BACKUP_DIR"/brewos_backup_*.tar.gz 2>/dev/null | tail -n +8 | xargs -r rm

echo ""
echo "Backup complete!"
echo "Location: $BACKUP_DIR/$BACKUP_FILE"
echo "Size: $BACKUP_SIZE"

