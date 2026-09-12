# Comprehensive Audit of Existing Repository — CURRENT_STATE.md

## 1. System Overview & Executive Summary

This document presents an exhaustive, component-by-component architectural, security, and operational audit of the initial `radhe-radhe-restaurant` repository. The codebase was originally initiated from a rapid prototyping / AI-assisted template utilizing Express, Vite, React 19, and Drizzle ORM. 

While the existing project contains strong initial visual ideas (such as dark-plum and gold color tokens, Playfair Display typography, and an extensive set of 53 pre-installed Radix/Shadcn UI primitives), it is heavily encumbered with cloud-sandbox dependencies, unverified client-side commerce inputs, incomplete payment capabilities, and an un-normalized database model.

---

## 2. Component-by-Component Review

### 2.1 Package & Dependency Architecture (`package.json`)
*   **Status**: Mixed.
*   **Installed Dependencies**:
    *   `react` & `react-dom` v19.2.1: Modern React foundation.
    *   `@trpc/server`, `@trpc/client`, `@trpc/react-query` v11.6.0: Robust end-to-end type-safe RPC.
    *   `drizzle-orm` v0.44.5 & `mysql2` v3.15.0: Configured for MySQL, which prevents direct utilization of PostgreSQL-specific Row Level Security (RLS) on Supabase free-tier.
    *   `tailwindcss` v4.1.14 & `tw-animate-css`: Contemporary utility styling.
    *   `lucide-react` v0.453.0: Standard iconography.
    *   Radix UI primitives (53 components in `client/src/components/ui/`): Excellent UI toolkit available for form fields, dialogs, drawers, dropdowns, and tables.
    *   **Deadweight / Technical Debt**:
        *   `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` without active configuration.
        *   Shopify scripts and test harnesses (`scripts/shopify-probe.runner.ts`, `server/routers/commerce.ts`, `server/_core/shopify.ts`, `server/shopify.smoke.test.ts`). These were retained as legacy stubs but add noise and confusion.

### 2.2 Routing & Navigation Architecture
*   **Client Routing (`client/src/App.tsx`)**:
    *   Uses `wouter` v3.3.5.
    *   Active routes: `/` (Home), `/operations` (Operations), `/profile` (Profile), `/manage` (ContentManager), `/404` (NotFound).
    *   **Critical Gaps**:
        *   No dedicated `/menu` or category discovery route; browsing is confined to a 3-item slice on the landing page.
        *   No `/checkout` route; checkout was embedded in a slide-out cart drawer.
        *   No `/order/:id` or customer live order tracking page.
        *   No `/driver` route for delivery partner dispatch and GPS telemetry.
        *   No dedicated `/admin` workspace with sub-routing for analytics, payment queue, coupon engine, or restaurant settings.

### 2.3 Database & ORM Model (`drizzle/schema.ts` & `drizzle.config.ts`)
*   **Dialect**: MySQL (`dialect: "mysql"`).
*   **Tables**:
    *   `users`: Flat user record. Role is an enum (`user`, `admin`). Lacks granular permissions (`OWNER`, `MANAGER`, `ORDER_STAFF`, `DRIVER`).
    *   `menu_items`: Flat table without support for variants (sizes, crusts, portions), add-on groups, ingredients, allergen warnings, or preparation estimates.
    *   `site_content`: Key-value content store.
    *   `delivery_addresses`: Minimal customer address store.
    *   `orders`: Lacks lifecycle status (`PENDING_PAYMENT`, `PAYMENT_CLAIMED`, `PAYMENT_VERIFIED`, `OUT_FOR_DELIVERY`). Only had (`new`, `confirmed`, `preparing`, `ready`, `completed`, `cancelled`).
    *   `order_items`: Simple snapshot table; lacks add-on snapshots.
    *   `reservations`: Flat table.
*   **Missing Critical Entities**:
    *   No `payments` or transaction tracking table.
    *   No `order_status_history` audit table.
    *   No `coupons` or `coupon_redemptions` table.
    *   No `restaurant_settings` table for tax rates, delivery fee rules, opening hours, or emergency pause.
    *   No `driver_locations` table for active tracking.
    *   No `audit_logs` table for compliance and internal accountability.

### 2.4 Authentication & Authorization
*   **Status**: Severely broken for standalone production deployment.
*   **Mechanism**:
    *   Relied on `VITE_OAUTH_PORTAL_URL` and `server/_core/oauth.ts`.
    *   Redirected client logins to an external sandbox portal (`/app-auth`). In standard hosting or local development, `startLogin()` points to `undefined/app-auth` and crashes.
    *   Session cookies (`COOKIE_NAME = "app_session_id"`) use a custom JWT scheme (`sdk.createSessionToken`) tied to Manus sandbox infrastructure.
*   **Authorization**:
    *   A single `adminProcedure` checked `ctx.user?.role === 'admin'`.
    *   No RBAC for kitchen staff, menu managers, or delivery drivers.

### 2.5 Pricing & Order Calculation Integrity
*   **Status**: Critical Security Vulnerability.
*   **Analysis**:
    *   In `server/routers.ts` (lines 38–44), `customer.placeOrder` accepts:
        ```typescript
        items: z.array(z.object({
          menuItemId: z.number().int().positive(),
          nameSnapshot: z.string().min(1).max(160),
          priceSnapshot: z.string().regex(/^\d+(\.\d{1,2})?$/),
          quantity: z.number().int().min(1).max(20)
        }))
        ```
    *   In `server/db.ts` (lines 46–57), the subtotal is computed directly from `item.priceSnapshot`:
        ```typescript
        const subtotal = input.items.reduce((sum, item) => sum + Number(item.priceSnapshot) * item.quantity, 0).toFixed(2);
        ```
    *   **Vulnerability**: An attacker can inspect HTTP network requests, alter `priceSnapshot` from `"420.00"` to `"1.00"`, and place an order for ₹1. The server never validates the submitted price against the authoritative database record!

### 2.6 Payments Logic
*   **Status**: Incomplete.
*   **Analysis**:
    *   Only `cash_on_delivery` and `pay_at_pickup` were supported.
    *   No UPI intent generation (`upi://pay?pa=...`).
    *   No dynamic QR code generation based on server-calculated amounts.
    *   No customer payment reference (UTR) entry or screenshot attachment.
    *   No admin payment verification queue.
    *   No abstraction layer for future gateway integration (Razorpay / Cashfree).

### 2.7 Asset Storage & Image Delivery
*   **Status**: Broken external proxy.
*   **Analysis**:
    *   Images are served via `/manus-storage/*`, which forwards requests to `ENV.forgeApiUrl` and `ENV.forgeApiKey`.
    *   Without those proprietary API keys, all dish photographs and ambience photos fail with HTTP 500 / 502 errors.
    *   No native image upload pipeline with MIME inspection, file size bounds, or WebP conversion.

### 2.8 Customer Experience & UX
*   **Status**: High visual potential, but compromised by unfinished interactions.
*   **Issues**:
    *   Table reservation in `client/src/pages/Home.tsx` (line 48) invokes multiple browser `window.prompt()` popups rather than submitting the visual form fields on screen.
    *   Menu is hardcoded to a static fallback list when the database has no records.
    *   Cart state in `CartContext.tsx` is held in memory and vanishes upon page reload.
    *   No dish detail modal or customization options for sizing, toppings, or spice preferences.

### 2.9 Operations & Admin Experience
*   **Status**: Elementary prototype.
*   **Issues**:
    *   `Operations.tsx` provides a flat list of orders with a simple status select dropdown.
    *   No real-time polling or WebSocket updates.
    *   No order detail drawer displaying full customer snapshots, add-ons, or delivery address breakdown.
    *   `ContentManager.tsx` allows dish creation with raw URL text inputs, but provides no image upload, no variant manager, and no category sorting.

---

## 3. Technical Debt, Risks & Missing Requirements Matrix

| Area | Current State | Risk / Defect | Required Production State |
|---|---|---|---|
| **Price Calculation** | Client sends `priceSnapshot` | **CRITICAL**: Price tampering vulnerability | Server-authoritative price lookup & recalculation |
| **Auth System** | Proprietary OAuth portal | **CRITICAL**: Cannot run standalone or authenticate users | Self-contained Supabase Auth / Local JWT with RBAC |
| **Asset Storage** | Proprietary Forge API proxy | **HIGH**: Images fail to load | Supabase Storage / local static assets with WebP pipeline |
| **Payment Flow** | COD & Pickup only | **HIGH**: Lacks digital payment | Direct UPI dynamic QR & intent + admin verification queue |
| **Database Dialect** | MySQL | **HIGH**: Cannot use Supabase free-tier RLS | PostgreSQL with comprehensive schema, indexes, and RLS |
| **Order Tracking** | None | **MEDIUM**: Customers cannot track delivery | Realtime status timeline + MapLibre live driver GPS map |
| **Driver Dispatch** | None | **MEDIUM**: Drivers cannot view or update orders | Dedicated `/driver` mobile PWA with secure location pings |
| **Admin Controls** | Elementary status dropdown | **MEDIUM**: Lack of operational controls | Full No-Code Admin OS: Orders, CMS, Settings, Pause switch |
| **Cart Persistence** | In-memory React state | **LOW**: Cart lost on reload | LocalStorage persistence with server sync on checkout |

---

## 4. Preservation & Modernization Strategy

1.  **Preserve & Elevate**:
    *   The rich dark-plum (`#161016`), warm cream (`#f8f1e8`), and champagne-gold (`#d6a85e`) aesthetic.
    *   The elegant serif typography pairing (Playfair Display for headings, Manrope for body text).
    *   The complete set of 53 Radix/Shadcn primitives in `client/src/components/ui/`.
    *   The end-to-end type safety of tRPC.
2.  **Systematically Replace**:
    *   Replace MySQL schema with PostgreSQL Drizzle schema.
    *   Replace proprietary OAuth with standard secure session management.
    *   Replace hardcoded image proxy with authenticated upload and direct asset delivery.
    *   Replace client-side order calculation with strict server-side validation.
3.  **Implement Anew**:
    *   Direct UPI payment engine & Verification Queue.
    *   MapLibre GL JS + OpenFreeMap driver tracking subsystem.
    *   Granular multi-role RBAC (`OWNER`, `MANAGER`, `ORDER_STAFF`, `MENU_MANAGER`, `DRIVER`, `CUSTOMER`).
    *   No-code Admin OS with "Pause Online Orders" and operational analytics.
