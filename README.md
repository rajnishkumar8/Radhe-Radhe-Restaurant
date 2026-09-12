# Shri Radhe Radhe Restaurant — Commercial Digital Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![TRPC](https://img.shields.io/badge/tRPC-11.6-25c2a0.svg)](https://trpc.io/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-PostgreSQL-c5f74f.svg)](https://orm.drizzle.team/)
[![MapLibre GL JS](https://img.shields.io/badge/MapLibre-Vector_Tiles-228b22.svg)](https://maplibre.org/)
[![Status](https://img.shields.io/badge/Status-Production_Ready-brightgreen.svg)]()

A high-performance, commercial digital commerce platform built for **Shri Radhe Radhe Restaurant** (Near Radhe Communication, Lohna Road, Dharampur, Manigachhi, Darbhanga, Bihar). Engineered from the ground up to provide a bespoke luxury editorial dining brand experience for guests, combined with a comprehensive no-code operations and kitchen management console for the restaurant owners.

---

## The Three Connected Experiences

1. **Public Customer Storefront (`/`, `/menu`, `/track`)**:
   - Editorial luxury dining brand identity (rich warm terracotta `#C05621`, deep navy `#1A365D`, warm parchment `#FDFBF7`, gold accents `#D69E2E`).
   - Dynamic database-driven menu catalog with categorized browsing, search, dietary indicators (Veg, Jain, Vegan), and spice-level markers.
   - Interactive Dish Customizer Modal for portion selection, spice adjustment, and chef notes.
   - Table Reservation Modal with confirmation and guest tracking.
   - Live Delivery Tracking powered by **MapLibre GL JS** and **OpenFreeMap** vector tiles (100% free, zero Google Maps API fees).

2. **Customer Account & Ordering Experience (`/checkout`, `/order-confirmation/:id`)**:
   - Persistent client-side cart with real-time **server-authoritative recalculation** (`trpc.cart.calculate`), completely immunizing the business against client-side price tampering.
   - **Direct UPI Dynamic Intent & QR Engine**: generates standard NPCI `upi://pay` strings and high-contrast QR codes directly tied to the authoritative server order amount and bank VPA.
   - 12-digit UPI UTR / Reference ID submission and payment claim workflow.
   - Order status timeline tracking and receipt snapshots.

3. **Restaurant Owner & Operations Desk (`/admin`, `/driver`)**:
   - **Live Orders Board**: Realtime Kanban queue with audio chime alerts for new tickets, filterable by fulfillment and status.
   - **Payment Verification Desk**: Eliminates 2-3% aggregator and gateway fees by allowing staff to audit incoming customer UTR claims against bank statements before confirming orders.
   - **Menu CMS**: 1-click price changes, dish creation, image uploads, and 86-ing ("Sold Out") toggle without code changes.
   - **Emergency Kitchen Controls**: Global "Pause Online Orders" switch with custom guest closure announcements and Kitchen Busy Mode adjustment (Normal / Busy / Very Busy).
   - **Coupons Engine**: Configurable flat, percentage, and free delivery vouchers with cart minimums and usage caps.
   - **Driver Dispatch & Telemetry (`/driver`)**: Mobile PWA enabling delivery drivers to accept orders, stream live GPS pings via browser Geolocation, and complete orders with automatic location access revocation.
   - **Immutable Audit Logs**: Comprehensive security trail recording every price change, status transition, and administrative action.

---

## Architectural Highlights & Zero-Cost Stack

- **Zero-Cost Initial Hosting**: Runs on Cloudflare Pages / Node runtime and free-tier PostgreSQL (Supabase / Neon).
- **Decoupled Architecture**:
  - `PaymentProvider` abstraction: Default `DirectUPIProvider` (0% transaction fees) with seamless plug-in capability for `RazorpayProvider` via Admin Settings.
  - `MapProvider` abstraction: Default `OpenFreeMapProvider` with vector tiles, eliminating Google Maps billing.
  - `StorageProvider` abstraction: Validated image uploads with MIME magic-byte verification.
- **Dual-Database Resilience**: Uses Drizzle ORM connecting to PostgreSQL when `DATABASE_URL` is set, with an automated, in-memory transactional database fallback seeded with rich regional menu items, categories, and settings for offline development and instant testing.

---

## Project Structure

```
├── client/                     # Frontend React 19 Single Page Application
│   ├── src/
│   │   ├── components/         # Luxury UI design system components
│   │   │   ├── CartDrawer.tsx  # Slide-out interactive cart with fee breakdown
│   │   │   ├── DishCustomizerModal.tsx # Customization modal
│   │   │   ├── ReservationModal.tsx    # Table booking modal
│   │   │   ├── Navbar.tsx      # Editorial header with role switcher
│   │   │   └── Map/LiveTrackingMap.tsx # MapLibre GL JS vector driver map
│   │   ├── contexts/           # Cart & application contexts
│   │   ├── pages/              # Storefront, checkout, tracking & admin views
│   │   │   ├── Home.tsx        # Brand storytelling & signature plates
│   │   │   ├── Menu.tsx        # Full menu catalog with live filter chips
│   │   │   ├── Checkout.tsx    # Address capture & payment selection
│   │   │   ├── OrderConfirmation.tsx # Dynamic UPI QR & UTR claim desk
│   │   │   ├── TrackOrder.tsx  # Customer live order & driver map
│   │   │   ├── admin/AdminPortal.tsx # Unified operational command center
│   │   │   └── driver/DriverPortal.tsx # Driver dispatch mobile PWA
├── server/                     # Node.js backend & TRPC API
│   ├── _core/                  # TRPC server initialization, context & RBAC
│   ├── db.ts                   # Unified database client & memory fallback
│   ├── routers.ts              # End-to-end type-safe API router definitions
│   ├── services/
│   │   ├── payment/            # PaymentProvider (Direct UPI & Razorpay)
│   │   ├── maps/               # MapProvider (OpenFreeMap vector tiles)
│   │   └── storage/            # StorageProvider (MIME validated uploads)
│   └── *.test.ts               # Vitest automated test suite
├── drizzle/                    # Relational schema and PostgreSQL migrations
│   ├── schema.ts               # Strict relational schema with RLS & indexes
│   └── migrations/             # Production SQL migration scripts
└── documentation/              # Exhaustive engineering & operations manuals
    ├── PRD.md                  # Product Requirements Document
    ├── DESIGN.md               # Editorial luxury design system specification
    ├── ARCHITECTURE.md         # Full topology & order state machine
    ├── DATABASE.md             # Schema dictionary, ERD & RLS policies
    ├── SECURITY.md             # Threat modeling & security headers
    ├── SECURITY_AUDIT.md       # Audit matrix with zero Critical/High findings
    ├── FREE_TIER_ARCHITECTURE.md # Zero-cost limits and scaling projections
    ├── RESTAURANT_ADMIN_GUIDE.md # Standardized operations guidebook
    └── IMPLEMENTATION_ROADMAP.md # 26-phase engineering completion log
```

---

## Quickstart & Local Development

### Prerequisites
- Node.js 18+ (Tested on Node v25.4.0)
- pnpm 9+ or npm / npx

### 1. Installation
```bash
npx pnpm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(The application runs immediately with full demo seed data even before configuring remote PostgreSQL or Supabase credentials).*

### 3. Running the Test Suite
```bash
npx pnpm test
```
Runs 20 automated tests validating price calculations, Direct UPI claims, driver security, and RBAC permissions.

### 4. Type Checking
```bash
npx pnpm check
```

### 5. Running the Local Development Server
```bash
npx pnpm dev
```
Open your browser at `http://localhost:3000`:
- **Storefront**: `http://localhost:3000/`
- **Menu Catalog**: `http://localhost:3000/menu`
- **Admin Command Center**: `http://localhost:3000/admin`
- **Driver Dispatch Portal**: `http://localhost:3000/driver`

---

## Testing & Quality Gates

The test suite covers:
- **Price Tampering Immunity**: Validates that all unit prices, discounts, delivery fees, and taxes are calculated exclusively on the server.
- **Direct UPI Lifecycle**: Validates that customer UTR submissions transition orders to `payment_claimed`, and that only authenticated `staff`/`admin` roles can invoke `operations.verifyPayment`.
- **Driver GPS Ingestion**: Validates that unauthorized users cannot emit coordinates, and that driver tracking terminates immediately upon delivery.
- **Role-Based Access Control**: Validates that customers cannot access administrative endpoints or mutate restaurant settings.

---

## Deployment to Production

### Production Build
```bash
npx pnpm build
```
Generates optimized frontend assets in `dist/public` and bundles the Node.js server into `dist/index.js`.

### Free-Tier Production Deployment
Follow the step-by-step instructions in [FREE_TIER_ARCHITECTURE.md](file:///c:/Users/rajni/AI/AI%20Projects/radhe-radhe-restaurant/FREE_TIER_ARCHITECTURE.md) to deploy:
1. **Frontend / API**: Cloudflare Pages with Node runtime adapter.
2. **Database**: Supabase Free Tier (PostgreSQL 15) with `drizzle/migrations/0001_initial_pg_schema.sql`.
3. **Maps**: OpenFreeMap vector tile endpoint (`https://tiles.openfreemap.org/styles/liberty`).
4. **Payments**: Direct UPI with no gateway fees.

---

## Documentation Index

- [PRD.md](file:///c:/Users/rajni/AI/AI%20Projects/radhe-radhe-restaurant/PRD.md) — Product Requirements & Personas
- [DESIGN.md](file:///c:/Users/rajni/AI/AI%20Projects/radhe-radhe-restaurant/DESIGN.md) — Editorial Design System & Color Palette
- [ARCHITECTURE.md](file:///c:/Users/rajni/AI/AI%20Projects/radhe-radhe-restaurant/ARCHITECTURE.md) — Topology, Services & State Machine
- [DATABASE.md](file:///c:/Users/rajni/AI/AI%20Projects/radhe-radhe-restaurant/DATABASE.md) — Relational Schema, Constraints & RLS
- [SECURITY.md](file:///c:/Users/rajni/AI/AI%20Projects/radhe-radhe-restaurant/SECURITY.md) — Defensive Controls & Security Headers
- [SECURITY_AUDIT.md](file:///c:/Users/rajni/AI/AI%20Projects/radhe-radhe-restaurant/SECURITY_AUDIT.md) — Comprehensive Vulnerability Audit Report
- [FREE_TIER_ARCHITECTURE.md](file:///c:/Users/rajni/AI/AI%20Projects/radhe-radhe-restaurant/FREE_TIER_ARCHITECTURE.md) — Zero-Cost Architecture & Scaling Limits
- [RESTAURANT_ADMIN_GUIDE.md](file:///c:/Users/rajni/AI/AI%20Projects/radhe-radhe-restaurant/RESTAURANT_ADMIN_GUIDE.md) — Staff & Admin Operations Manual
- [IMPLEMENTATION_ROADMAP.md](file:///c:/Users/rajni/AI/AI%20Projects/radhe-radhe-restaurant/IMPLEMENTATION_ROADMAP.md) — 26-Phase Completion Ledger

---

© 2026 Shri Radhe Radhe Restaurant. Commercial Platform Deliverable.
