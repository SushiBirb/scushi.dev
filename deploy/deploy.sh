#!/usr/bin/env bash
# ==============================================================================
# scushi.dev Production Deployment Script
# ==============================================================================
# Builds static assets with Astro and streams the tarball directly to
# the production Caddy container (LXC 104) on scushi-server.
# ==============================================================================

set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "==> Building static distribution..."
cd "$ROOT_DIR"
pnpm build

echo "==> Streaming release tarball to LXC 104 (/var/www/scushi.dev)..."
tar -czf - -C "$ROOT_DIR/dist" . | ssh -o BatchMode=yes root@192.168.1.250 "pct exec 104 -- tar -xzf - -C /var/www/scushi.dev && pct exec 104 -- chown -R 1000:1000 /var/www/scushi.dev && pct exec 104 -- systemctl start adguard-stats-sync.service"

# Purge Cloudflare edge cache for HTML pages (they are edge-cached for 2h
# via the "Edge Cache Static HTML and Pages" Cache Rule; hashed /_astro/
# assets are content-addressed and never need purging).
echo "==> Purging Cloudflare edge cache for HTML pages..."
CF_KEY="$(sed -n '1p' "$HOME/school/api.md" | tr -d '[:space:]')"
if [ -n "$CF_KEY" ]; then
    curl -fsS -X POST \
        -H "X-Auth-Email: jmattingly@proitserv.com" \
        -H "X-Auth-Key: $CF_KEY" \
        -H "Content-Type: application/json" \
        --data '{"files":["https://scushi.dev/","https://scushi.dev/projects/","https://scushi.dev/systems/"]}' \
        "https://api.cloudflare.com/client/v4/zones/c6b843c8747c553d73b92d0e63f2910e/purge_cache" >/dev/null \
        && echo "    Edge cache purged." \
        || echo "    WARNING: Cloudflare purge failed (HTML refreshes within 2h Edge TTL)."
else
    echo "    WARNING: Cloudflare API key not found at \$HOME/school/api.md - skipping purge."
fi

echo "==> Production deployment verified successfully! (https://scushi.dev)"
