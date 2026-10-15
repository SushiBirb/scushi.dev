# scushi.dev Design Roadmap & Architectural Notes

## Current Implementation
- **Framework:** Astro v7 (Static Site Generation, 0% server CPU overhead)
- **Styling:** Tailwind CSS v4, `@fontsource/jetbrains-mono`
- **Colorway:** Deep Obsidian Canvas (`#0e0e11`), Accent Pink (`#ffade4`), Light Container Pink (`#ffd7ee`)
- **Key Navigation:** `[h] home` (`/`), `[p] projects` (`/projects`), `[s] systems` (`/systems`) with keyboard listeners
- **Active Background:** Procedural ASCII Descent (`AsciiDescent.astro`) — a 3-tier parallax text canvas transitioning from celestial starfields to infrastructural matrix gates to the infernal subterranean abyss.
  - Features center-masking (dimmed to `~0.03 - 0.05` behind body text, atmospheric in margins).
- **Systems & Hardening:** Obfuscated production homelab telemetry showcasing AdGuard Home, CrowdSec IPS v1.8.1, Maltrail IDS, ntopng L2–L7 DPI, and Tailscale mesh.

---

## Retired Experiments
- **Progressive Botanical Vines (`GrowingVines.astro`):**
  - *Evaluation:* The page content is intentionally concise and fast-reading, meaning the scroll distance is too short for a botanical growth animation to unfurl smoothly. The component remains preserved in the repo for potential future long-form essays/docs.

---

## Next Planned Experiment: Interactive Cursor Vector Field

### Concept Overview
A mathematical / physics-inspired directional vector field background:
1. **The Grid:**
   - A regular 2D matrix of small directional elements (minimal needles, line segments `-`, subtle arrows `→`, or directional glyphs).
2. **The Vector Math:**
   - Each point $(x, y)$ calculates its angle to the visitor's cursor:
     $$\theta(x, y) = \text{atan2}(y_{\text{mouse}} - y, x_{\text{mouse}} - x)$$
   - The elements smoothly rotate toward the cursor with a slight inertia/spring effect.
3. **Distance Attenuation & Wave Effect:**
   - Elements closer to the mouse have slightly stronger brightness/length, fading off into resting orientation in distant corners.
   - Mouse movement could trigger a subtle ripple/wave propagating outward across the field.
4. **Performance:**
   - 100% Canvas 2D or WebGL running on client GPU via `requestAnimationFrame`. Zero server overhead.
