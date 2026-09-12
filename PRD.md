# Product Requirements Document (PRD) — Shri Radhe Radhe Restaurant

## Table of Contents
*   **1. Product Vision & Executive Summary** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 1
*   **2. Stakeholders & User Personas** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 2
*   **3. Functional Specifications** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 3
    *   2.1 Public Customer Storefront . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 3
    *   2.2 Customer Account & Checkout Experience . . . . . . . . . . . . . . . . . . . . . . . . 4
    *   2.3 Direct UPI Payment & Claim Verification . . . . . . . . . . . . . . . . . . . . . . . . . 5
    *   2.4 Live Order Operations & Kitchen Console . . . . . . . . . . . . . . . . . . . . . . . . . 6
    *   2.5 Menu & Content Management CMS . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 7
    *   2.6 Restaurant Settings & Operational Controls . . . . . . . . . . . . . . . . . . . . . . . 8
    *   2.7 Delivery Driver Subsystem & Live Tracking . . . . . . . . . . . . . . . . . . . . . . . . 9
*   **4. Non-Functional Requirements** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 10
*   **5. Security & Privacy Matrix** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 11
*   **6. Release Criteria & Acceptance Verification** . . . . . . . . . . . . . . . . . . . . . . . . . . . . 12

---

## 1. Product Vision & Executive Summary

Shri Radhe Radhe Restaurant is a premier dining destination located near Radhe Communication, Lohna Road, Dharampur, Manigachhi, Darbhanga, Bihar, celebrating the heritage of North Indian live-fire culinary traditions and warm Mithila hospitality. The objective of this commercial platform is to build an independent, sovereign digital restaurant commerce engine that empowers the restaurant to accept direct orders, eliminate intermediary commissions, present a luxury brand identity, and run kitchen operations through a no-code administrative console.

The platform provides three interconnected user interfaces:
1.  **Public Editorial Storefront**: Immersive brand presentation, dynamic menu discovery, dish customization, table reservations, and restaurant story.
2.  **Customer Account & Ordering Flow**: Frictionless guest ordering, saved delivery addresses, persistent cart, dynamic Direct UPI payment, and live delivery telemetry.
3.  **Restaurant Admin & Operations Console (No-Code OS)**: Order dispatch queue, UPI payment audit desk, full menu/category CMS, promotional coupon engine, analytics, delivery tracking, and operational switches (including "Pause Online Orders" and "Busy Mode").

---

## 2. Stakeholders & User Personas

*Table 1 – Stakeholder & User Persona Profiles*

| Persona | Primary Goal | Key Frustration | Core Workflows |
|---|---|---|---|
| **Priya (Diner / Guest)** | Discover signature dishes, customize orders, and pay seamlessly via UPI app. | Clunky checkout forms, hidden delivery charges, and untracked deliveries. | Browse menu, filter dietary tags, customize spice levels, pay via UPI QR, track driver. |
| **Rajesh (Restaurant Owner)** | Maximize direct revenue, update menu prices, toggle sold-out items, and view daily sales. | Having to call a software developer for minor menu updates or price tweaks. | Review daily revenue, pause orders during rush hours, create promotional coupons, inspect audit logs. |
| **Vikram (Head Chef / Staff)** | Receive incoming orders with clear preparation notes and advance order statuses instantly. | Missed orders, unclear modification notes, and confusion over payment confirmation. | Hear audio alerts on new orders, view dish modifiers, verify customer payment, mark orders Ready. |
| **Amit (Delivery Driver)** | View assigned customer delivery addresses, access phone shortcuts, and broadcast GPS coordinates. | Complicated native apps requiring heavy storage and battery consumption. | Log into `/driver` mobile PWA, click "Start Delivery", stream location, mark orders Delivered. |

---

## 3. Functional Specifications

### 3.1 Public Customer Storefront
*   **Hero Experience**: High-impact editorial imagery showcasing signature fire-grilled tandoor preparations, clear CTAs for *Explore Menu* and *Reserve a Table*, and dynamic opening status pill.
*   **Menu Catalog & Filtering**:
    *   Browse by categories (e.g., *House Classics*, *From the Fire*, *Breads & Rice*, *Desserts*).
    *   Filter by dietary preferences (*Vegetarian*, *Vegan*, *Jain-Friendly*).
    *   Spice level indicator (Mild, Medium, Spicy, Extra Hot).
    *   Real-time search with partial string matching across dish names, ingredients, and descriptions.
*   **Dish Customization (Modal)**:
    *   Select sizes/portions (e.g., Half vs. Full, Small vs. Medium vs. Large).
    *   Select add-ons and accompaniments with transparent server-verified prices.
    *   Special preparation notes input (max 200 characters).
*   **Table Reservations**:
    *   Intuitive booking form with guest count, requested date, meal slot, and phone number.
    *   Server-side validation preventing past-date reservations.

### 3.2 Customer Account & Checkout Experience
*   **Cart Drawer**:
    *   Persistent local storage backing; retains items across page reloads and browser sessions.
    *   Displays itemized lines, selected modifiers, quantities, item notes, subtotal, packing fees, tax, and estimated delivery fee.
    *   Server calculation endpoint re-evaluates all prices and totals; never trusts client arithmetic.
*   **Frictionless Checkout**:
    *   Fulfillment toggle: *Home Delivery* vs. *Self Pickup*.
    *   Delivery address selector (for signed-in users) or inline address capture (for guests).
    *   Ordering mode: *ASAP* or *Scheduled* (within restaurant operating hours).
    *   Promo code input field with real-time server eligibility checking.

### 3.3 Direct UPI Payment & Claim Verification
*   **Dynamic Intent & QR Generation**:
    *   Generates dynamic UPI string using server-calculated total:
        `upi://pay?pa=<UPI_ID>&pn=<RESTAURANT_NAME>&am=<SERVER_AMOUNT>&cu=INR&tr=<ORDER_REF>`
    *   Renders crisp QR code for desktop users to scan with any UPI app (GPay, PhonePe, Paytm, BHIM).
    *   Provides "Pay via UPI App" deep link for mobile users.
*   **Payment Claiming Workflow**:
    *   Order enters `PAYMENT_INITIATED` status upon placement.
    *   Customer submits UPI 12-digit transaction/UTR reference and optional receipt screenshot.
    *   Status shifts to `PAYMENT_CLAIMED_BY_CUSTOMER` / `PAYMENT_PENDING_VERIFICATION`.
    *   Customer sees clear notification that the restaurant will verify payment before dispatch.

### 3.4 Live Order Operations & Kitchen Console
*   **Order Queue Kanban & Table**:
    *   Visual status columns: *Incoming / Payment Verification*, *Confirmed*, *Preparing*, *Ready*, *Out for Delivery*, *Completed*.
    *   Audible sound chime and badge flash upon arrival of new orders.
    *   Quick action buttons to advance status with 1 click.
*   **Order Detail Drawer**:
    *   Displays customer contact, full delivery address, line items with modifiers, special instructions, and financial breakdown.
    *   Order cancellation action requiring mandatory reason logging.

### 3.5 Menu & Content Management CMS
*   **Dish Management**:
    *   Add, edit, duplicate, and soft-delete menu items.
    *   Configure name, slug, description, category, base price, discount price, dietary tags, preparation time, and availability switch.
    *   Manage variant options (size, crust) and add-on groups (toppings, sides).
    *   Upload dish photography with automated WebP conversion and client preview.
*   **Category Management**:
    *   Create, rename, reorder, and toggle visibility of menu categories.

### 3.6 Restaurant Settings & Operational Controls
*   **Emergency Controls**:
    *   **Pause Online Orders Switch**: Instantly disables checkout while keeping menu browsing active.
    *   **Busy Mode Selector**: *Normal* (30 min), *Busy* (50 min), *Very Busy* (75 min) adjusting customer-facing prep estimates.
*   **Financial & Delivery Rules**:
    *   Configure UPI ID and recipient display name.
    *   Set packaging charges, GST tax rate, flat delivery fee, and free-delivery order threshold.
    *   Define weekly business opening hours and ordering cutoff times.

### 3.7 Delivery Driver Subsystem & Live Tracking
*   **Driver Interface (`/driver`)**:
    *   Mobile-optimized PWA with driver authentication.
    *   View active order assignments, customer destination, and phone link.
    *   "Start Delivery" button initiates high-accuracy HTML5 Geolocation tracking (`watchPosition`).
    *   Periodically transmits coordinates (latitude, longitude, accuracy) to the server.
    *   "Mark Delivered" button terminates tracking.
*   **Customer Live Tracking (`/track/:id`)**:
    *   MapLibre GL JS vector map with OpenFreeMap tiles.
    *   Shows restaurant marker, customer destination pin, and moving driver marker.
    *   Straight-line distance calculation and estimated arrival.
    *   Strict privacy: tracking ceases immediately when order is delivered; customers cannot track orders other than their own.

---

## 4. Non-Functional Requirements

*Table 2 – Non-Functional System Benchmarks*

| Dimension | Target Metric | Architectural Enforcement |
|---|---|---|
| **Performance** | Mobile LCP < 2.5s, FID < 100ms, CLS < 0.1 | Next-gen WebP images, dynamic code splitting, server-side caching. |
| **Availability** | 99.9% uptime on zero-cost tier | Cloudflare CDN edge distribution, stateless API design. |
| **Data Integrity** | 100% price snapshot immutability | Database snapshots of prices, variants, add-ons at moment of checkout. |
| **Mobile UX** | 100% touch targets >= 44x44px | Tailored responsive design system verified at 320px, 375px, 430px. |
| **Accessibility** | WCAG 2.2 AA Compliance | Accessible contrast ratios, focus outlines, ARIA live regions, semantic HTML. |

---

## 5. Security & Privacy Matrix

*   **Field Security**:
    *   **Authoritative Pricing**: All item prices, discounts, fees, and final charges computed server-side.
    *   **Role-Based Access Control**: Database-level and API-level checks verifying user roles (`OWNER`, `MANAGER`, `ORDER_STAFF`, `DRIVER`).
    *   **Driver Telemetry Isolation**: Driver can only broadcast coordinates for active orders assigned to their account ID.
    *   **Customer IDOR Defense**: Row-level policies and query boundaries preventing Customer A from accessing Customer B's orders or tracking coordinates.
    *   **Input Sanitization**: Strict Zod validation schemas defending against parameter tampering and SQL injection.

---

## 6. Release Criteria & Acceptance Verification

The commercial release of Shri Radhe Radhe Restaurant is approved only upon satisfying the following acceptance criteria:
1.  A guest can browse the full menu, customize dishes, and submit an order without mandatory pre-registration.
2.  Dynamic UPI QR code and intent generate the exact server-calculated amount.
3.  Orders appear instantly in the Admin Live Queue with audio alert.
4.  Restaurant staff can verify UPI claims or reject invalid payments with clear customer feedback.
5.  Owner can modify dish prices, add new items, and toggle the "Pause Online Orders" switch from the mobile admin interface.
6.  Delivery driver can stream GPS coordinates from `/driver` and customer can observe their delivery on the MapLibre live map.
7.  All automated test suites pass with 0 critical or high vulnerability findings.
