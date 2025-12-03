#!/bin/bash
#
# BrewOS Server Restore Script
#
# Restores a backup created by backup-server.sh
#
# Usage:
#   ./scripts/restore-server.sh /path/to/brewos_backup.tar.gz
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check arguments
if [[ -z "$1" ]]; then
    log_error "Usage: $0 /path/to/brewos_backup.tar.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [[ ! -f "$BACKUP_FILE" ]]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

log_warn "This will overwrite the current database and configuration!"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
    log_info "Restore cancelled"
    exit 0
fi

log_info "Restoring from backup: $BACKUP_FILE"

# Create temp directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Extract backup
log_info "Extracting backup..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Show backup info
if [[ -f "$TEMP_DIR/backup_info.json" ]]; then
    log_info "Backup info:"
    cat "$TEMP_DIR/backup_info.json" | jq . 2>/dev/null || cat "$TEMP_DIR/backup_info.json"
    echo ""
fi

# Stop the service
log_info "Stopping BrewOS..."
cd /root/brewos/src/cloud
docker compose down || true

# Restore database
if [[ -d "$TEMP_DIR/data" ]]; then
    log_info "Restoring database..."
    docker run --rm \
        -v brewos_brewos-data:/data \
        -v "$TEMP_DIR:/backup:ro" \
        alpine sh -c "rm -rf /data/* && cp -a /backup/data/. /data/"
fi

# Restore configuration (optional - ask first)
if [[ -d "$TEMP_DIR/config" ]]; then
    read -p "Restore configuration files? (yes/no): " RESTORE_CONFIG
    if [[ "$RESTORE_CONFIG" == "yes" ]]; then
        log_info "Restoring configuration..."
        [[ -f "$TEMP_DIR/config/web.env" ]] && cp "$TEMP_DIR/config/web.env" /root/brewos/src/web/.env
        [[ -f "$TEMP_DIR/config/cloud.env" ]] && cp "$TEMP_DIR/config/cloud.env" /root/brewos/src/cloud/.env
        [[ -f "$TEMP_DIR/config/Caddyfile" ]] && cp "$TEMP_DIR/config/Caddyfile" /etc/caddy/Caddyfile && systemctl reload caddy
    fi
fi

# Start the service
log_info "Starting BrewOS..."
docker compose up -d

# Wait for service
sleep 5

if curl -sf http://localhost:3001/api/health > /dev/null; then
    log_success "Restore complete! BrewOS is running."
else
    log_error "Service health check failed!"
    docker compose logs --tail=20
    exit 1
fi

