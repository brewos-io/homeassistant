#!/bin/bash
# Shared Docker build script for CI/CD deployments
# Fixes BuildKit cache corruption and ensures clean builds

set -e

echo "=== Docker Build Script ==="

# Fix corrupted Docker BuildKit snapshotter state
echo "Stopping Docker and clearing BuildKit state..."
systemctl stop docker || true
rm -rf /var/lib/docker/buildkit || true
systemctl start docker
sleep 2

echo "Building Docker image (no cache)..."
docker compose build --no-cache

echo "=== Docker build complete ==="

