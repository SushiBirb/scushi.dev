# scushi.dev Design Roadmap & Architectural Notes

## Current Implementation
- **Framework:** Astro v7 (Static Site Generation, 0% server CPU overhead)
- **Styling:** Tailwind CSS v4, `@fontsource/jetbrains-mono`
- **Colorway:** Deep Obsidian Canvas (`#0e0e11`), Accent Pink (`#ffade4`), Light Container Pink (`#ffd7ee`)
- **Key Navigation:** `[h] home` (`/`), `[p] projects` (`/projects`), `[s] systems` (`/systems`) with keyboard listeners
- **Active Background:** Interactive Cursor Vector Field (`VectorField.astro`)
  - A responsive 2D matrix of directional needle vectors that smoothly rotate with inertia to point toward the visitor's cursor:
    $$\theta(x, y) = \text{atan2}(y_{\text{mouse}} - y, x_{\text{mouse}} - x)$$
  - Features distance-based proximity lighting (needles near the cursor illuminate in vibrant `#ffd7ee` / `#ffade4` with tiny directional tip nodes).
  - Center-column masking dampens opacity behind main text to guarantee 100% legibility.
  - Idle state smoothly falls back to an ambient mathematical wave motion when mouse is inactive.
- **Systems & Hardening:** Obfuscated production homelab telemetry showcasing AdGuard Home, CrowdSec IPS v1.8.1, Maltrail IDS, ntopng L2–L7 DPI, and Tailscale mesh.

---

## Preserved Alternative Backgrounds (Easily Swappable)

1. **Procedural ASCII Descent (`src/components/archive/AsciiDescent.astro` & `src/components/AsciiDescent.astro`):**
   - 3-tier parallax text canvas transitioning from celestial starfields (`* · ° ✦ ~ +`) at the top, to infrastructural matrix gates (`| [ ] # _ =`) in the middle, to subterranean infernal stalagmites (`v ▼ . , ; %`) at the bottom.
   - Parallax scrolling with center-column opacity masking.

2. **Progressive Botanical Vines (`src/components/GrowingVines.astro`):**
   - Scroll-depth reactive organic vines and leaf buds in viewport margins inspired by *Slay the Princess* (`slaytheland`).
