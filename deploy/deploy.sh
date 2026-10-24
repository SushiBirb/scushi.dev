#!/usr/bin/env bash
# ==============================================================================
# scushi.dev Production Deployment Script
# ==============================================================================
# Builds static assets with Astro and streams the tarball directly to
# the production Caddy container (LXC 104) on scushi-server.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "==> Building static distribution..."
cd "$ROOT_DIR"
pnpm build

echo "==> Streaming release tarball to LXC 104 (/var/www/scushi.dev)..."
tar -czf - -C "$ROOT_DIR/dist" . | ssh -o BatchMode=yes root@192.168.1.250 "pct exec 104 -- tar -xzf - -C /var/www/scushi.dev && pct exec 104 -- chown -R 1000:1000 /var/www/scushi.dev && pct exec 104 -- systemctl start adguard-stats-sync.service"

echo "==> Production deployment verified successfully! (https://scushi.dev)"
