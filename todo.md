# Project TODO

- [x] Configure Shopify-powered catalog, cart, and secure checkout integration (superseded by zero-cost internal ordering)
- [x] Create cinematic, high-end visual system with 3D-inspired restaurant styling
- [x] Build mobile-first responsive navigation and touch-friendly interactions
- [x] Build public homepage with signature dishes, ambience storytelling, and clear order/reservation CTAs
- [x] Add public menu browsing experience
- [x] Add restaurant story page/section
- [x] Add dining highlights page/section
- [x] Add contact details and operating hours
- [x] Add order and reservation call-to-action flows
- [x] Add installable Progressive Web App manifest, icons, and service worker shell
- [x] Add secure customer sign-in integration using the provided auth foundation
- [ ] Add protected customer profile foundation
- [ ] Add saved delivery information foundation with validation and authorization
- [x] Add durable database-backed models and procedures for customer and future restaurant operations
- [ ] Add production-minded loading, empty, error, and authorization handling
- [x] Add unit tests for new server procedures and core feature behavior
- [x] Verify mobile and desktop layouts with visual screenshots
- [x] Run type checks, tests, and production build verification
- [ ] Save final project checkpoint and deliver the website project

- [x] Register the injected commerce router and Shopify environment exports (retained for future migration compatibility)
- [ ] Verify the Shopify catalog through the provided probe before building storefront UI
- [ ] Use the normalized commerce types and CartContext for all storefront interactions
- [ ] Keep initial Shopify preview catalog within the integration’s 1–2 product seeding rule

- [ ] Replace Shopify storefront assumptions with a TastyIgniter integration plan
- [x] Confirm whether the restaurant already has a TastyIgniter installation, API endpoint, and credentials (none currently available)
- [ ] Define the customer-side flow: menu, cart, checkout/order placement, reservations, account, profile, and saved delivery details
- [x] Define the restaurant-side flow: protected staff login, incoming order queue, status updates, menu management, customer/order detail views, and reservation management
- [x] Add role-based authorization so restaurant operations are restricted to authorized staff/admin users
- [ ] Define synchronization and error-handling behavior between the premium storefront and TastyIgniter
- [ ] Remove or isolate Shopify-specific UI and runtime assumptions after the TastyIgniter path is confirmed

- [x] Use the project database and server as the initial source of truth for menu, customer, order, and reservation data
- [ ] Add an adapter/service boundary so a future TastyIgniter connector can replace the internal commerce provider cleanly
- [x] Build the protected restaurant operations console as a first-class product surface
- [x] Remove or isolate Shopify-specific runtime and UI assumptions from the customer ordering path

- [x] Keep the initial launch free of paid third-party commerce, maps, messaging, plugins, and native-app dependencies
- [x] Support cash on delivery and pay-at-pickup as the initial order payment methods
- [x] Avoid paid map APIs by using address text and optional device location only
- [x] Make online card payments an explicitly optional future upgrade, not part of the zero-cost launch
- [x] Isolate the previously configured Shopify files so they are not required by the zero-cost ordering flow

- [ ] Add a protected owner content manager with simple visual forms and no technical setup
- [ ] Let the owner upload or replace front-end images using the existing file storage
- [ ] Let the owner choose image placement such as hero, dining ambience, or menu item
- [x] Let the owner add, edit, remove, price, categorize, describe, and toggle availability for menu items
- [x] Add secure admin procedures for menu CRUD and image metadata updates
- [x] Add tests and responsive verification for owner content management

- [x] Add a security checklist covering authentication, authorization, validation, CSRF/session behavior, secure headers, and auditability
- [x] Ensure payment credentials are never stored or handled directly by the restaurant app
- [x] Add secure hosted-checkout integration boundaries for any future online payment gateway
- [x] Add visible admin-side controls for homepage imagery, menu imagery, menu details, prices, availability, orders, and reservations
- [x] Add safer owner-facing forms with visible validation, loading, success, and error states
- [x] Add security-focused tests for admin-only procedures, ownership checks, invalid inputs, and payment-data boundaries
- [x] Re-run production build and responsive verification after security and low-code control updates

- [x] Keep all technical implementation details out of the owner-facing experience and user communication
- [x] Present owner controls as simple visual dashboard actions, forms, previews, and uploads only
- [x] Ensure the final handoff requires no code editing or technical maintenance from the restaurant owner

- [x] Create a simple non-technical user guide for the restaurant owner
- [x] Explain owner sign-in, dashboard navigation, menu editing, pricing, availability, image management, orders, reservations, security, and payment handling

- [x] Research established restaurant ordering flows, persistent carts, checkout validation, and owner/admin access patterns
- [ ] Fix the owner account so the correct signed-in account receives admin access securely
- [x] Fix the cart so customers can add multiple menu items and edit them before checkout
- [x] Replace prompt-based customer details with a real checkout form
- [x] Validate names, phone numbers, fulfillment type, payment method, and delivery details on both client and server
- [x] Add visible loading, success, and error states for order submission
- [x] Add regression tests for admin access, multi-item carts, and invalid order input
- [ ] Re-verify the live customer and owner flows on mobile and desktop
