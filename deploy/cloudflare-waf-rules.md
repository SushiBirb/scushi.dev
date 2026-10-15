# Cloudflare WAF & Bot Protection Hardening Guide for scushi.dev

This document outlines the security rules to enforce Cloudflare Managed Challenges (CAPTCHA / Turnstile) and block automated scrapers, crawlers, and vulnerability scanners from reaching scushi.dev.

---

## 1. Enable Bot Fight Mode (Zero-Config Bot Mitigation)

1. Log in to the Cloudflare Dashboard.
2. Select the `scushi.dev` zone.
3. In the left navigation, navigate to **Security** -> **Bots**.
4. Toggle **Bot Fight Mode** to **On**.

**Effect:**
- Automatically identifies known malicious bots, search engine spoofers, and automated Python/Go HTTP requests.
- Issues a silent or interactive Cloudflare JavaScript/Turnstile challenge before traffic ever reaches the Cloudflare Tunnel.

---

## 2. Custom WAF Challenge Rule (Anti-Scraping & Threat Mitigation)

1. In the left navigation, navigate to **Security** -> **WAF** -> **Custom rules**.
2. Click **Create rule**.
3. Configure the rule as follows:
   - **Rule Name:** `Enforce Managed Challenge on Suspicious Traffic`
   - **Field / Expression:**
     ```text
     (cf.threat_score gt 10) or (cf.client.bot and not cf.verified_bot_category in {"search_engine_crawler"}) or (http.request.version eq "HTTP/1.0")
     ```
   - **Action:** Select **Managed Challenge**.
4. Click **Deploy**.

**Effect:**
- Legitimate visitors with verified browsers pass transparently.
- Scraper scripts, headless crawlers with elevated threat scores, or outdated HTTP/1.0 clients must solve a Cloudflare challenge.
- Verified search engines (Google, Bing) remain permitted.

---

## 3. Rate Limiting Rule (Anti-DDoS & Content Enumeration)

1. In **Security** -> **WAF**, select the **Rate limiting rules** tab.
2. Click **Create rate limiting rule**.
3. Configure the rule:
   - **Rule Name:** `Rate Limit Aggressive Scrapers`
   - **If incoming requests match:** `Hostname equals scushi.dev`
   - **Requests:** Exceeds `60` requests per `10 seconds`.
   - **Action:** **Managed Challenge**.
   - **Duration:** `1 hour`.
4. Click **Deploy**.

**Effect:**
- Protects the Cloudflare Tunnel and home internet bandwidth from aggressive web crawling or scraping loops.

---

## 4. Zero-Trust Access Policies (Optional Admin Isolation)

For admin interfaces (`proxmox.scushi.dev`, etc.):
1. In Cloudflare Zero Trust (**Access** -> **Applications**), create an Access Application.
2. Set policy to require GitHub OAuth or email one-time PIN (OTP) before granting connection access.
