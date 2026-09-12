# Zero-Cost Infrastructure Architecture — FREE_TIER_ARCHITECTURE.md

## Table of Contents
*   **1. Zero-Cost Infrastructure Overview** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 1
*   **2. Service-by-Service Free Tier Matrix** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 2
*   **3. Resource Budgeting & Usage Projections** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 3
*   **4. Scaling Bottlenecks & Defensive Mitigations** . . . . . . . . . . . . . . . . . . . . . . . . . . . 4
*   **5. Long-Term Commercial Migration Pathways** . . . . . . . . . . . . . . . . . . . . . . . . . . . 5
*   **6. Service Terms & Acceptable Use Compliance** . . . . . . . . . . . . . . . . . . . . . . . . . . 6

---

## 1. Zero-Cost Infrastructure Overview

The deployment architecture of Shri Radhe Radhe Restaurant is engineered to operate reliably on zero-cost, free-tier cloud infrastructure while maintaining enterprise security, fast global delivery, and high availability.

By decoupling stateful services (PostgreSQL database) from stateless edge distribution (Cloudflare CDN) and substituting paid commercial APIs (Google Maps, Twilio, commercial payment gateways) with sovereign open protocols (OpenFreeMap, Direct UPI, standard SMTP), the platform eliminates recurring monthly SaaS overhead.

---

## 2. Service-by-Service Free Tier Matrix

*Table 1 – Free Tier Service Breakdown & Scaling Boundaries*

| Service | Provider & Tier | Purpose | Free-Tier Limits | Expected Restaurant Usage | Scaling Risk | Migration Strategy |
|---|---|---|---|---|---|---|
| **Edge CDN & Web Hosting** | Cloudflare Pages / Workers Free Tier | Frontend delivery, edge caching, static asset distribution. | Unlimited bandwidth, 100,000 requests/day for edge functions. | ~5,000 – 15,000 page views/month. | Complex edge computation exceeding CPU millisecond limits. | Cloudflare Pro ($20/mo) or standard self-hosted VPS ($5/mo). |
| **Relational Database** | Supabase PostgreSQL Free Tier | Core transactional store, orders, menu CMS, RLS enforcement. | 500 MB database storage, 2 active projects, 50,000 MAU. | ~10–20 MB in Year 1 (~3,000 orders/month). | Database storage exhaustion from high-resolution GPS ping retention. | Nightly pruning of historical GPS telemetry; Supabase Pro tier ($25/mo). |
| **Authentication Engine** | Supabase Auth / Local JWT | Customer accounts, staff RBAC, session cookie management. | 50,000 Monthly Active Users (MAU). | ~800 – 2,000 active customer accounts. | Exceeding 50k MAU limit under massive growth. | Built-in Supabase scale-up or self-hosted GoTrue/Keycloak instance. |
| **Media & Asset Storage** | Supabase Storage / Local Static WebP | Food photography, dining ambience, staff receipt verification. | 1 GB storage, 2 GB egress bandwidth/month. | ~150 – 300 MB compressed WebP images. | Uncompressed customer receipt uploads exhausting quota. | Client-side Canvas compression to 1200px WebP prior to upload. |
| **Mapping & Vector Tiles** | OpenFreeMap / MapLibre GL JS | Restaurant location, delivery dispatch, customer driver tracking. | Free public vector tile endpoint; zero billing accounts. | ~500 – 1,500 active tracking sessions/month. | Public tile endpoint throttling during regional spikes. | Self-hosted OpenMapTiles container on VPS or MapTiler free tier (100k tiles). |
| **Digital Payments** | Direct UPI Protocol (NPCI) | Instant digital payment via dynamic QR and mobile intent. | 100% Free; 0% transaction commissions. | Unlimited transactions within merchant UPI bank account limits. | Manual staff verification required during high-volume dinner rushes. | Enable Razorpay / Cashfree provider toggle in Admin Settings. |
| **Transactional Email** | Resend Free Tier | Order receipts, payment confirmation, staff alert summaries. | 3,000 emails/month (100 emails/day). | ~50 – 100 emails/day during peak service. | Exceeding daily cap on busy weekend festivals. | In-app order status notifications; upgrade to Resend Pro ($20/mo). |
| **Bot Defense** | Cloudflare Turnstile | Captcha-free verification on checkout and login forms. | Completely free, unlimited volume. | 1,000 – 3,000 verification challenges/month. | None identified. | Fallback to internal honeypot field verification. |

---

## 3. Resource Budgeting & Usage Projections

### 3.1 Database Footprint Analysis
*   An average completed order (including order line snapshots, add-on snapshots, and status history) consumes approximately **2.8 KB** of structured PostgreSQL storage.
*   At 3,000 orders per month:
    `3,000 orders * 2.8 KB = 8.4 MB per month (~100.8 MB per year)`
*   With Supabase's **500 MB** free-tier allowance, the restaurant can operate comfortably for **3 to 4 years** without hitting database capacity boundaries.

### 3.2 GPS Telemetry Storage Management
*   Live driver tracking generates 1 coordinate ping every 12 seconds (~300 pings per 1-hour delivery = ~25 KB per delivery).
*   **Defensive Rule**: Telemetry records are tagged with a 24-hour expiration window. A scheduled background cleanup task prunes `driver_locations` records older than 24 hours once the associated order status reaches `DELIVERED` or `CANCELLED`.

---

## 4. Scaling Bottlenecks & Defensive Mitigations

*   **Supabase Free Tier Inactivity Pause**:
    *   *Risk*: Supabase pauses free-tier projects after 7 consecutive days of complete database inactivity.
    *   *Mitigation*: Daily operational activity (menu queries, customer visits, staff logins) naturally keeps the database active. A lightweight daily heartbeat ping ensures continuity.
*   **Resend 100 Emails/Day Limit**:
    *   *Risk*: On festival days (e.g., Diwali), order volume may exceed 100 orders.
    *   *Mitigation*: Email notifications are prioritized for customer order receipts. Kitchen order notifications utilize audio chimes and real-time WebSockets/polling on the admin console rather than email.

---

## 5. Long-Term Commercial Migration Pathways

When the restaurant scales to high transaction volumes, the architecture allows painless, incremental upgrades:
1.  **Payment Gateway (Razorpay/Cashfree)**: Toggle switch in Admin Settings. The `PaymentProvider` abstraction seamlessly switches from manual UPI verification to automated webhook-verified settlements.
2.  **Dedicated Map Tiles (MapTiler / Mapbox)**: Changing a single tile URL environment variable upgrades the map rendering without frontend code modifications.
3.  **Dedicated PostgreSQL VPS**: The Drizzle schema is 100% standard ANSI SQL/PostgreSQL and can be backed up via `pg_dump` and restored to any cloud instance ($5/month Hetzner/DigitalOcean).

---

## 6. Service Terms & Acceptable Use Compliance

*   **No Tile Scraping**: The mapping subsystem respects OpenFreeMap terms by utilizing client-side vector tile rendering with appropriate map attribution (`© OpenStreetMap contributors`).
*   **Direct UPI Integrity**: The platform generates standard NPCI UPI links (`upi://pay?pa=...`) and does not intercept, store, or process debit/credit card PANs or CVVs, ensuring full compliance with Reserve Bank of India (RBI) payment guidelines.
