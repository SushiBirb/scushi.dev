# scushi.dev Design Roadmap & Architectural Notes

## Current Implementation
- **Framework:** Astro v7 (Static Site Generation, 0% server CPU overhead)
- **Styling:** Tailwind CSS v4, `@fontsource/jetbrains-mono`
- **Colorway:** Deep Obsidian Canvas (`#0e0e11`), Accent Pink (`#ffade4`), Light Container Pink (`#ffd7ee`)
- **Key Navigation:** `[h] home` (`/`), `[p] projects` (`/projects`), `[s] systems` (`/systems`) with keyboard listeners
- **Active Canvas:** Clean, confident dark canvas with the subtle 160px cursor spotlight (zero visual noise or battery consumption).
- **Systems & Hardening:** Obfuscated production homelab telemetry showcasing AdGuard Home, CrowdSec IPS v1.8.1, Maltrail IDS, ntopng L2–L7 DPI, and Tailscale mesh.

---

## Preserved Background Experiments (Archived & Swappable)

All exploratory backgrounds remain fully preserved in `src/components/archive/` and can be re-enabled at any time:

1. **Interactive Cursor Vector Field (`src/components/archive/VectorField.astro` & `src/components/VectorField.astro`):**
   - 2D lattice of directional needle vectors rotating toward the mouse cursor via $\text{atan2}(dy, dx)$ with shortest-arc lerp and proximity lighting.

2. **Procedural ASCII Descent (`src/components/archive/AsciiDescent.astro` & `src/components/AsciiDescent.astro`):**
   - 3-tier parallax text canvas transitioning from celestial starfields (`* · ° * ~ +`) at the top, to infrastructural matrix gates (`| [ ] # _ =`) in the middle, to subterranean infernal stalagmites (`v ▼ . , ; %`) at the bottom.

3. **Progressive Botanical Vines (`src/components/GrowingVines.astro`):**
   - Scroll-depth reactive organic vines and leaf buds in viewport margins inspired by *Slay the Princess* (`slaytheland`).
