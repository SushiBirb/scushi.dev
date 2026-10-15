# scushi.dev Design Roadmap & Architectural Notes

## Current Implementation
- **Framework:** Astro v7 (Static Site Generation, 0% server CPU overhead)
- **Styling:** Tailwind CSS v4, `@fontsource/jetbrains-mono`
- **Colorway:** Deep Obsidian Canvas (`#0e0e11`), Accent Pink (`#ffade4`), Light Container Pink (`#ffd7ee`)
- **Key Navigation:** `[h] home` (`/`), `[p] projects` (`/projects`), `[s] systems` (`/systems`) with keyboard listeners
- **Margin Atmosphere:** Progressive scroll-reactive botanical vines (`GrowingVines.astro`) inspired by the woods of *Slay the Princess* (`slaytheland`)
- **Systems & Hardening:** Obfuscated production homelab telemetry showcasing AdGuard Home, CrowdSec IPS v1.8.1, Maltrail IDS, ntopng L2–L7 DPI, and Tailscale mesh

---

## Planned Experiment: The Monospace ASCII Descent (Heaven to Hell)

### Concept Overview
A multi-tier procedural ASCII parallax background tracking the user's scroll depth:
1. **Tier 1: Celestial / The Heavens (`/` - Hero)**
   - Starfields, ethereal clouds, floating constellation lines (`*`, `·`, `°`, `~`, `+`, `^`)
   - Airy, tranquil, faint opacity (`~0.08 - 0.12`)
2. **Tier 2: The Circuit & Infrastructure (Mid-Scroll - `/projects` & `/systems`)**
   - Architectural logic gates, network brackets, server bus traces (`[ ]`, `|`, `/ \`, `#`, `_`, `=`, `0101`)
   - High density, structured technical alignment
3. **Tier 3: The Cavern / Infernal Descent (Bottom - `#elsewhere` / Footer)**
   - Subterranean roots, downward-pointing stalactites, drifting embers (`v`, `v`, `.`, `,`, `;`, `:`, `%`)
   - Dramatic shift in glyph cadence

### Implementation Guidelines
- **Contrast & Legibility:** Must remain masked behind a linear/radial CSS gradient mask so body text readability is never compromised.
- **Client Execution:** Implemented via fixed `<pre>` layers or a 2D Canvas text loop using `requestAnimationFrame`, zero server runtime.
