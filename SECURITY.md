# Security Policy & Defensive Controls — SECURITY.md

## Table of Contents
*   **1. Security Philosophy & Threat Modeling** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 1
*   **2. Core Threat Vectors & Defensive Mitigations** . . . . . . . . . . . . . . . . . . . . . . . . . 2
    *   2.1 Client-Side Price & Parameter Tampering . . . . . . . . . . . . . . . . . . . . . . . . . 2
    *   2.2 Payment Verification & Fraud Defenses . . . . . . . . . . . . . . . . . . . . . . . . . . 3
    *   2.3 Insecure Direct Object References (IDOR / BOLA) . . . . . . . . . . . . . . . . . . . 4
    *   2.4 Broken Authentication & Session Management . . . . . . . . . . . . . . . . . . . . 5
    *   2.5 Broken Authorization & Role Escalation . . . . . . . . . . . . . . . . . . . . . . . . . . 6
    *   2.6 SQL Injection & Data Tampering . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 7
    *   2.7 Cross-Site Scripting (XSS) & Input Sanitization . . . . . . . . . . . . . . . . . . . . . 8
    *   2.8 Cross-Site Request Forgery (CSRF) & State Fixation . . . . . . . . . . . . . . . . . 9
    *   2.9 Delivery Driver GPS Spoofing & Tracking Privacy . . . . . . . . . . . . . . . . . . . 10
    *   2.10 File Upload Security & Malicious Payloads . . . . . . . . . . . . . . . . . . . . . . . 11
*   **3. Security Headers & Content Security Policy (CSP)** . . . . . . . . . . . . . . . . . . . . . 12
*   **4. Secret Management & Credential Hygiene** . . . . . . . . . . . . . . . . . . . . . . . . . . 13
*   **5. Immutable Administrative Audit Logging** . . . . . . . . . . . . . . . . . . . . . . . . . . . 14
*   **6. Vulnerability Disclosure & Incident Response** . . . . . . . . . . . . . . . . . . . . . . . . 15

---

## 1. Security Philosophy & Threat Modeling

Shri Radhe Radhe Restaurant operates under a zero-trust security paradigm: **No client-submitted value is authoritative for financial, operational, or access decisions.**

We do not claim any software is unhackable; instead, we implement rigorous defense-in-depth where every request must pass through multiple validation gates: transport security, procedure middleware, server-side business logic, and database-level Row Level Security.

---

## 2. Core Threat Vectors & Defensive Mitigations

### 2.1 Client-Side Price & Parameter Tampering
*   **Attack Vector**: An adversary intercepts the checkout request and modifies line-item prices, subtotal, discount, or delivery fees to arbitrary low amounts.
*   **Defensive Control**:
    *   The client is strictly prohibited from supplying monetary amounts in order placement or cart mutation procedures.
    *   The server accepts only `menuItemId`, `variantId`, `addonIds`, and `quantity`.
    *   The server re-queries the authoritative database records, recalculates all sums, verifies coupon conditions, computes statutory taxes and fees, and derives the final payable total.

### 2.2 Payment Verification & Fraud Defenses
*   **Attack Vector**: A customer initiates a Direct UPI payment, cancels or closes the app, and manually claims that payment succeeded to trick the kitchen into cooking food.
*   **Defensive Control**:
    *   Opening a UPI app, generating a QR code, or clicking "I have paid" is NOT payment confirmation.
    *   Entering a UPI UTR reference number or uploading a payment screenshot transitions the order to `PAYMENT_CLAIMED` / `PAYMENT_PENDING_VERIFICATION`.
    *   The order remains in a non-actionable state for kitchen preparation until an authorized staff member verifies credit in the restaurant's merchant account and executes `verifyPayment` in the Admin Verification Queue.
    *   Payment status can never transition to `PAYMENT_VERIFIED` from a client-side mutation alone.

### 2.3 Insecure Direct Object References (IDOR / BOLA)
*   **Attack Vector**: Customer A alters the order ID parameter in the URL or API call to view Customer B's order details, delivery address, or tracking coordinates.
*   **Defensive Control**:
    *   All customer data queries require session authentication and enforce `WHERE user_id = ctx.user.id`.
    *   Guest orders utilize cryptographically random, high-entropy Order UUIDs (`nanoid(24)`) in addition to sequential display order numbers.
    *   Database Row Level Security policies prevent cross-tenant record retrieval even in the event of an application logic bug.

### 2.4 Broken Authentication & Session Management
*   **Attack Vector**: Session hijacking, brute-force credential attacks, credential stuffing, and session fixation.
*   **Defensive Control**:
    *   Sessions are issued as cryptographically signed, encrypted HTTP-only cookies (`SameSite=Lax`, `Secure=true`, `HttpOnly=true`).
    *   Passwords (when used) are salted and hashed using Argon2id or Scrypt with high work factors.
    *   Sensitive auth endpoints are protected with Cloudflare Turnstile token validation and aggressive IP-based rate limiting (max 5 attempts per 15 minutes).

### 2.5 Broken Authorization & Role Escalation
*   **Attack Vector**: A regular customer calls staff or admin tRPC procedures (`operations.*`, `admin.*`) to modify menu items or approve orders.
*   **Defensive Control**:
    *   Role-based procedure middleware:
        *   `publicProcedure`: Only for browsing catalog, guest cart calculations, and reservation requests.
        *   `protectedProcedure`: Validates active user identity for personal profile and address books.
        *   `staffProcedure`: Restricts access to `order_staff`, `manager`, and `owner`.
        *   `adminProcedure`: Strictly enforces `manager` or `owner` role.
    *   UI element visibility is never treated as security. Every procedure validates caller role server-side.

### 2.6 SQL Injection & Data Tampering
*   **Defensive Control**:
    *   100% of database interactions utilize Drizzle ORM's parameterized query builder.
    *   Zero raw SQL string concatenations exist in application code.

### 2.7 Cross-Site Scripting (XSS) & Input Sanitization
*   **Defensive Control**:
    *   All incoming string inputs (customer notes, address lines, guest names, dish descriptions) are validated and bounded using Zod schemas.
    *   React 19's automatic output encoding neutralizes HTML script injection in all rendered views.

### 2.8 Delivery Driver GPS Spoofing & Tracking Privacy
*   **Attack Vector**:
    *   Malicious actors transmitting fake driver coordinates to disrupt delivery tracking.
    *   Customers eavesdropping on driver locations after delivery is finished.
*   **Defensive Control**:
    *   Driver coordinate submission requires authenticated session with `driver` role.
    *   The server verifies that the driver is actively assigned to the target order, and the target order status is strictly `OUT_FOR_DELIVERY`.
    *   Customers can only access tracking coordinates while their order is active. The moment an order is marked `DELIVERED`, location streaming endpoints return HTTP 404 / 410.

### 2.9 File Upload Security
*   **Defensive Control**:
    *   File size capped at 4 MB.
    *   MIME types validated via magic byte inspection (allowing only `image/jpeg`, `image/png`, `image/webp`).
    *   Uploaded files are stripped of EXIF metadata and re-encoded as WebP before persistence.
    *   Files are assigned randomized UUID names to prevent path traversal or overwriting attacks.

---

## 3. Security Headers & Content Security Policy (CSP)

All HTTP responses emitted by the server enforce modern security headers:

*Table 1 – Defensive HTTP Response Headers*

| Header | Production Directive Value | Purpose |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; connect-src 'self' https: wss:; frame-src https://challenges.cloudflare.com;` | Prevents unauthorized script injection and data exfiltration. |
| `X-Content-Type-Options` | `nosniff` | Blocks MIME-type sniffing exploits. |
| `X-Frame-Options` | `DENY` | Enforces clickjacking prevention. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Protects sensitive URL query parameters from leakage. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Mandates TLS/HTTPS transport. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self)` | Restricts browser sensor access to authorized origins. |

---

## 4. Secret Management & Credential Hygiene

*   **Zero Hardcoded Secrets**: Secrets (`DATABASE_URL`, `JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`) are stored exclusively in environment variables.
*   **Frontend Isolation**: Only variables prefixed with `VITE_` are exposed to client JavaScript bundles. The Supabase service-role key is NEVER exposed to the frontend.
*   **Repository Safeguards**: `.gitignore` strictly excludes `.env`, `.env.local`, and credential files.

---

## 5. Immutable Administrative Audit Logging

All privileged actions generate an append-only audit entry in `audit_logs`:
*   Staff login and session creation.
*   Menu item creation, price updates, and deletion.
*   Promotional coupon creation, editing, or deactivation.
*   Restaurant settings modifications (UPI VPA, tax rates, delivery fees).
*   Order cancellations (with required reason string).
*   Payment approval or rejection decisions.

---

## 6. Vulnerability Disclosure & Incident Response

Security reports should be submitted to `security@radheradhe.com`. Verified vulnerabilities will be acknowledged within 24 hours, with critical patches deployed within 48 hours.
