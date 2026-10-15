# scushi.dev

Personal portfolio, autonomous network defense architecture, and software engineering showcase for Joshua Mattingly (scushi).

Built with Astro v7, Tailwind CSS v4, JetBrains Mono typography, and client-hydrated canvas micro-interactions.

---

## 1. Architecture & Design Philosophy

- **Framework:** Astro v7 (Static Site Generation). Compiles to 100% static HTML, CSS, and vanilla JS at build time.
- **Zero Server CPU Overhead:** Emits static assets served directly off disk cache by Caddy, preserving Proxmox hypervisor compute for production homelab clusters, intrusion prevention, and database replication.
- **Typography:** Full JetBrains Mono monospace aesthetic via `@fontsource/jetbrains-mono`.
- **Colorway:** Deep Obsidian canvas (`#0e0e11`), accent pink (`#ffade4`), and light container highlight (`#ffd7ee`), aligned with the author's Arch Linux Hyprland environment.
- **Zero Emojis:** Strictly formatted using clean Markdown typography and standard text notation.

---

## 2. Interactive Features

- **Cursor-Revealed ASCII Spotlight:** The page remains clean and still by default. Moving the mouse casts a 180px flashlight beam revealing an underlying, world-anchored code matrix.
- **Continuous Density & Glyph Gradient:** The ASCII matrix continuously blends from airy celestial glyphs at the top, through structural logic gates in the mid-page, into dense subterranean stalagmites and embers near the footer.
- **Keyboard Navigation Shortcuts:** Global keyboard listeners allow instant navigation:
  - `[h]` — Smoothly returns to the very top of Home (`/`)
  - `[p]` — Navigates to Projects (`/projects`)
  - `[s]` — Navigates to Systems & Defense (`/systems`)
- **Interactive Defense Topology:** An interactive traffic flow inspector on `/systems` mapping ingress, telemetry (ntopng), heuristics (Maltrail), intrusion prevention (CrowdSec), and DNS sinkholing (AdGuard Home).
- **Terminal Scramble Effect:** The page header dynamically decrypts into `scushi.dev` upon mounting and on hover.
- **Native Mail Client Launch:** Clicking `email` initiates a native `mailto:` system launch (Outlook, Thunderbird, Mail) with an adjacent fallback copy tooltip.

---

## 3. Security Hardening & Edge Protection

The production deployment of scushi.dev follows an enterprise defense-in-depth posture:

### Security Headers (ECC Standard)
Configured in `deploy/Caddyfile`:
- `Content-Security-Policy`: Restricts resource execution to self with strict script and style boundaries.
- `X-Frame-Options: DENY`: Complete clickjacking protection.
- `X-Content-Type-Options: nosniff`: Prevents MIME-confusion attacks.
- `Strict-Transport-Security (HSTS)`: Two-year preload enforcement (`max-age=63072000; includeSubDomains; preload`).
- `Referrer-Policy: strict-origin-when-cross-origin`: Minimizes referrer leakage.
- `Permissions-Policy`: Completely disables camera, microphone, geolocation, and payment APIs.
- Server obfuscation: Strips `Server` and `X-Powered-By` response headers.

### Cloudflare WAF & Bot Scraping Mitigation
Documented in `deploy/cloudflare-waf-rules.md`:
- **Bot Fight Mode:** Automatically challenges automated scrapers, crawlers, and scanning scripts before reaching the origin.
- **Managed Challenge Rule:** Enforces Cloudflare Turnstile / CAPTCHA on requests with threat scores exceeding 10, unverified user-agents, or outdated HTTP versions.
- **Rate Limiting:** Challenges hosts exceeding 60 requests within a 10-second window.

### Infrastructure Obfuscation
All private network references (internal subnets, gateway IPs, container identifiers) are abstracted into logical architectural tiers to ensure zero internal reconnaissance surface.

---

## 4. Verified Credentials & Certifications

- **CompTIA Security+:** [Verify Credential 7b38561065474ce1ac4b63ba1ea10c1c](https://cp.certmetrics.com/CompTIA/en/public/verify/credential/7b38561065474ce1ac4b63ba1ea10c1c)
- **CompTIA A+:** [Verify Credential SB49Z15QFN411V33](https://cp.certmetrics.com/CompTIA/en/public/verify/credential/SB49Z15QFN411V33)
- **TestOut Network Pro:** Active Certification
- **TestOut Security Pro:** Active Certification
- **1st Place in State — Networking Infrastructures:** FBLA (2025)
- **1st Place in State — Software Development:** TSA (2025)

---

## 5. Repository Structure

```text
scushi.dev/
├── deploy/
│   ├── Caddyfile                  # Hardened production web server configuration
│   └── cloudflare-waf-rules.md    # WAF and bot challenge rules
├── public/
│   └── favicon.svg                # Monospace terminal favicon
├── src/
│   ├── components/
│   │   ├── archive/               # Preserved background experiments (VectorField, AsciiDescent)
│   │   ├── AsciiSpotlight.astro   # Cursor-revealed code matrix with continuous gradient
│   │   ├── Awards.astro           # State and national honors section
│   │   ├── Elsewhere.astro        # Social links, mailto launcher, and Morrowind lore
│   │   ├── HomelabNode.astro      # Obfuscated homelab summary card
│   │   ├── InfrastructureMap.astro# Interactive traffic flow and inspection map
│   │   ├── Navbar.astro           # Route navigation with keyboard keybinds
│   │   ├── ProjectCard.astro      # Project showcase cards with hover transitions
│   │   └── ScrambleText.astro     # Terminal text decryption effect
│   ├── layouts/
│   │   └── Layout.astro           # HTML shell, metadata, and spotlight integration
│   ├── pages/
│   │   ├── index.astro            # Homepage feed
│   │   ├── projects.astro         # Complete project catalog
│   │   └── systems.astro          # Autonomous defense and telemetry architecture
│   └── styles/
│       └── global.css             # Tailwind v4 configuration and JetBrains Mono styles
├── DESIGN_ROADMAP.md              # Architectural notes and archived component specifications
└── package.json
```

---

## 6. Local Development & Build

### Prerequisites
- Node.js >= 22.22.0
- pnpm >= 11.0.0

### Commands

```bash
# Install dependencies
pnpm install

# Start local development server (localhost:4321)
pnpm dev

# Build production static output to dist/
pnpm build

# Preview production build locally
pnpm preview
```

---

## 7. Author

**Joshua Mattingly (scushi)**
- LinkedIn: [linkedin.com/in/joshua-mattingly-39145721b](https://linkedin.com/in/joshua-mattingly-39145721b)
- GitHub: [github.com/SushiBirb](https://github.com/SushiBirb)
- Email: `jmattingly@proitserv.com`
