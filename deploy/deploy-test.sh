#!/usr/bin/env bash
# ==============================================================================
# scushi.dev Test Deployment Script (test.scushi.dev)
# ==============================================================================
# Builds static assets with Astro and streams the tarball directly to
# the test Caddy root (/var/www/test.scushi.dev) on LXC 104.
# ==============================================================================

set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "==> Building static distribution for test environment..."
cd "$ROOT_DIR"
pnpm build

echo "==> Streaming release tarball to LXC 104 (/var/www/test.scushi.dev)..."
tar -czf - -C "$ROOT_DIR/dist" . | ssh -o BatchMode=yes root@192.168.1.250 "pct exec 104 -- tar -xzf - -C /var/www/test.scushi.dev && pct exec 104 -- chown -R 1000:1000 /var/www/test.scushi.dev"

echo "==> Test deployment verified successfully! (http://test.scushi.dev)"
