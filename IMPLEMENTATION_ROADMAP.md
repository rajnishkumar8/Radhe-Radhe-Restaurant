# Master Implementation Roadmap — IMPLEMENTATION_ROADMAP.md

## 1. Roadmap Architecture & Phased Execution

This roadmap establishes a strict 26-phase sequence to transform the repository into a commercial-grade restaurant platform. Every phase defines clear deliverables, dependencies, security assertions, and quality gates.

---

## 2. Granular 26-Phase Sequence

```
[Phase 1: Repository Audit]
       │
       ▼
[Phase 2: PRD + Design + Architecture Docs]
       │
       ▼
[Phase 3: PostgreSQL Schema + Migrations + RLS]
       │
       ▼
[Phase 4: Multi-Role Auth & Session Management]
       │
       ▼
[Phase 5: Public Customer Website Redesign]
       │
       ▼
[Phase 6: Menu Browsing & Dish Customization]
       │
       ▼
[Phase 7: Persistent Cart & Server Recalculation]
       │
       ▼
[Phase 8: Frictionless Checkout Flow]
       │
       ▼
[Phase 9: Direct UPI Dynamic QR & Intent Engine]
       │
       ▼
[Phase 10: Admin Payment Verification Desk]
       │
       ▼
[Phase 11: Order State Machine & History Snapshot]
       │
       ▼
[Phase 12: Admin Analytics Dashboard]
       │
       ▼
[Phase 13: Live Order Operations Kanban]
       │
       ▼
[Phase 14: Menu & Category CMS with Add-ons]
       │
       ▼
[Phase 15: Restaurant Settings & Order Pause]
       │
       ▼
[Phase 16: Coupons & Promotional Discount Engine]
       │
       ▼
[Phase 17: Operational Analytics & Reporting]
       │
       ▼
[Phase 18: Delivery Driver PWA (/driver)]
       │
       ▼
[Phase 19: MapLibre Live Customer Order Tracking]
       │
       ▼
[Phase 20: Transactional Notifications & In-App Alerts]
       │
       ▼
[Phase 21: Semantic SEO & OpenGraph Optimization]
       │
       ▼
[Phase 22: WCAG 2.2 AA Accessibility Audit]
       │
       ▼
[Phase 23: Core Web Vitals & Asset Compression]
       │
       ▼
[Phase 24: Adversarial & Regression Test Suites]
       │
       ▼
[Phase 25: Security Audit & Hardening Matrix]
       │
       ▼
[Phase 26: Production Polish & Admin Documentation]
```

---

## 3. Phase Specifications

### Phase 1: Repository Audit
*   **Deliverables**: `CURRENT_STATE.md`, `IMPLEMENTATION_ROADMAP.md`.
*   **Gate**: All security risks, technical debt, and missing tables documented.

### Phase 2: System Architecture & Design Documentation
*   **Deliverables**: `PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, `FREE_TIER_ARCHITECTURE.md`.
*   **Gate**: Specifications established for luxury typography, tokens, provider abstractions, and zero-cost constraints.

### Phase 3: Database Schema, Migrations & RLS
*   **Deliverables**: PostgreSQL Drizzle schema (`drizzle/schema.ts`), migration SQL, `DATABASE.md`.
*   **Entities**: `profiles`, `categories`, `menu_items`, `menu_variants`, `menu_addons`, `orders`, `order_items`, `order_item_addons`, `order_status_history`, `payments`, `coupons`, `restaurant_settings`, `driver_locations`, `audit_logs`.
*   **Gate**: Foreign keys, check constraints, default values, and RLS policies enforced.

### Phase 4: Authentication & Authorization
*   **Deliverables**: Standalone session provider, PKCE / password / OTP login, role assignment (`OWNER`, `MANAGER`, `ORDER_STAFF`, `MENU_MANAGER`, `DRIVER`, `CUSTOMER`).
*   **Gate**: Unauthenticated requests cannot execute staff procedures. Secure httpOnly cookies with CSRF defense.

### Phase 5: Customer Website Transformation
*   **Deliverables**: Redesigned `Home.tsx` with editorial hero, restaurant story, real reservation modal, operating hours, and live availability badge.
*   **Gate**: No `window.prompt()` calls. High-aesthetic luxury styling matching `DESIGN.md`.

### Phase 6: Menu Discovery & Dish Details
*   **Deliverables**: `/menu` page, category pill navigation, dietary filters, instant search, and `DishCustomizerModal` supporting sizes, crusts, spice ratings, and add-on selection.
*   **Gate**: Client cannot submit invalid add-on combinations.

### Phase 7: Persistent Cart System
*   **Deliverables**: `CartContext.tsx` with `localStorage` persistence, item customizations, quantity bounds, notes, and server calculation procedure (`cart.calculate`).
*   **Gate**: Zero trust in client calculations. Server recalculates subtotal, packing charges, taxes, delivery fees, and discounts.

### Phase 8: Frictionless Checkout Flow
*   **Deliverables**: `/checkout` route with fulfillment toggle (Delivery vs. Pickup), delivery address selection/input, time-slot selector (ASAP vs. Scheduled), and payment selection.
*   **Gate**: Complete delivery address validation enforced on both client and server boundaries.

### Phase 9: Direct UPI Engine
*   **Deliverables**: Dynamic UPI intent string generator (`upi://pay?pa=...&pn=...&am=...&cu=INR&tr=...`), QR code modal, "Pay via UPI App" deep link, and UTR reference submission.
*   **Gate**: Server-authoritative amount baked into the payment string.

### Phase 10: Payment Verification Desk
*   **Deliverables**: `/admin/payments` verification queue displaying pending claims, order total, customer name, claim time, UTR number, and 1-click Confirm/Reject actions.
*   **Gate**: Payment can never become `PAYMENT_VERIFIED` through a client-side action alone.

### Phase 11: Order Lifecycle Engine
*   **Deliverables**: Full state machine (`PENDING_PAYMENT`, `PAYMENT_CLAIMED`, `PAYMENT_VERIFIED`, `ACCEPTED`, `PREPARING`, `READY`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`).
*   **Gate**: Every transition writes an immutable audit record to `order_status_history`.

### Phase 12: Admin Dashboard
*   **Deliverables**: `/admin` overview with revenue, order volume, average order value, pending queues, and performance charts.
*   **Gate**: No vanity metrics; operational numbers align directly with database snapshots.

### Phase 13: Live Order Operations
*   **Deliverables**: `/admin/orders` queue with sound notification for new orders, quick status buttons, detail slide-over, and cancellation reason modal.
*   **Gate**: Staff can accept and progress orders within 2 clicks.

### Phase 14: Menu & Category CMS
*   **Deliverables**: `/admin/menu` and `/admin/categories` with dish creator, variant matrix, add-on groups, WebP image upload, price editor, and drag-and-drop category sorting.
*   **Gate**: Owner can manage the entire menu without developer intervention.

### Phase 15: Restaurant Settings & Order Pause
*   **Deliverables**: `/admin/settings` controlling restaurant coordinates, business hours, delivery fees, tax rates, UPI VPA, and the emergency "PAUSE ONLINE ORDERS" switch.
*   **Gate**: When paused, browsing remains active while order placement displays a dignified explanation.

### Phase 16: Coupons & Promotional Engine
*   **Deliverables**: `/admin/coupons` with flat, percentage, or free-delivery discounts, cart minimums, usage limits, and active date bounds.
*   **Gate**: Server prevents coupon stacking and revalidates rules before finalizing order totals.

### Phase 17: Operational Analytics
*   **Deliverables**: Real-time sales reports, peak hour analysis, bestselling dish metrics, and fulfillment speed tracking.
*   **Gate**: Data calculated via indexed database aggregations without impacting checkout throughput.

### Phase 18: Delivery Driver PWA (`/driver`)
*   **Deliverables**: Mobile-first driver console, login, active delivery assignment, phone dialer shortcut, and "Start Delivery" location tracking toggle.
*   **Gate**: Driver can only view and update orders assigned to their authenticated account.

### Phase 19: MapLibre Live Customer Order Tracking
*   **Deliverables**: `/track/:id` route using MapLibre GL JS + OpenFreeMap tiles, rendering restaurant origin, customer destination, and active driver marker with straight-line distance.
*   **Gate**: Driver coordinates cease streaming once order status transitions to `DELIVERED`. Customer cannot view other orders.

### Phase 20: Transactional Notifications
*   **Deliverables**: Resend email integration for order receipts and in-app sound/banner notifications for new orders.
*   **Gate**: Failures in third-party notification APIs do not block database order writes.

### Phase 21: Search Engine Optimization (SEO)
*   **Deliverables**: Schema.org `Restaurant` structured data, OpenGraph metadata, `robots.txt`, XML sitemap, and canonical URLs.
*   **Gate**: 100% semantic HTML with descriptive titles on all routes.

### Phase 22: Accessibility (WCAG 2.2 AA)
*   **Deliverables**: Keyboard navigation, ARIA live regions for cart updates, contrast validation, and screen reader announcements.
*   **Gate**: Focus traps on modals, visible focus indicators, and `prefers-reduced-motion` compliance.

### Phase 23: Performance & Core Web Vitals
*   **Deliverables**: WebP image pipeline, lazy loading, script deferral, dynamic code splitting, and database indexing.
*   **Gate**: Fast LCP (< 2.5s) and zero CLS (< 0.1) on mobile 3G/4G networks.

### Phase 24: Testing & Adversarial Verification
*   **Deliverables**: Vitest test suites testing pricing tampering, auth bypassing, IDOR order access, coupon manipulation, and driver location spoofing.
*   **Gate**: 100% passing test suites across all core business rules.

### Phase 25: Security Audit & Hardening Matrix
*   **Deliverables**: `SECURITY_AUDIT.md`, Content Security Policy (CSP), HSTS headers, rate-limiting rules, and sensitive data sanitization.
*   **Gate**: Zero CRITICAL or HIGH findings in the audit matrix.

### Phase 26: Production Polish & Documentation
*   **Deliverables**: `README.md`, `RESTAURANT_ADMIN_GUIDE.md`, `.env.example`, and clean production build verification.
*   **Gate**: The restaurant owner can run daily operations entirely via the visual admin UI without technical assistance.
