# Design System & Visual Specification — DESIGN.md

## Table of Contents
*   **1. Brand Personality & Design Philosophy** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 1
*   **2. Visual Principles** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 2
*   **3. Typography & Font Hierarchy** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 3
*   **4. Color Architecture & Palettes** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 4
*   **5. Spatial System, Grids & Breakpoints** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 5
*   **6. Elevation, Radii & Depth** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 6
*   **7. Component Specifications** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 7
    *   7.1 Buttons & Interactive Controls . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 7
    *   7.2 Form Fields & Inputs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 8
    *   7.3 Cards & Dish Display Tiles . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 9
    *   7.4 Badges, Tags & Dietary Indicators . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 10
    *   7.5 Navigation Bars & Sticky Mobile Controls . . . . . . . . . . . . . . . . . . . . . . . . 11
    *   7.6 Modals, Sheets & Cart Drawer . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 12
    *   7.7 Operational Tables & Status Badges . . . . . . . . . . . . . . . . . . . . . . . . . . . . 13
*   **8. States: Loading, Skeletons, Empty & Error Handling** . . . . . . . . . . . . . . . . . . . . . . 14
*   **9. Image Treatment & Art Direction** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 15
*   **10. Motion, Hover & Micro-Interactions** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 16
*   **11. Accessibility (WCAG 2.2 AA)** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 17
*   **12. Customer vs. Admin Experience Paradigm** . . . . . . . . . . . . . . . . . . . . . . . . . . . 18

---

## 1. Brand Personality & Design Philosophy

**PREMIUM EDITORIAL RESTAURANT × MODERN LUXURY COMMERCE**

The digital experience for **Shri Radhe Radhe Restaurant** embodies regal Rajasthani hospitality expressed through contemporary editorial design. It communicates warmth, patience, live fire, and culinary mastery.

### Anti-Patterns (What We Are NOT)
*   **Not a delivery aggregator clone**: No crowded neon badges, flashing discount tickers, or visual clutter reminiscent of Swiggy or Zomato.
*   **Not a generic SaaS dashboard**: No cold gray bootstrap cards or sterile templates.
*   **Not an overdone AI template**: No exaggerated frosted glass, neon glow effects, floating generic blobs, or chaotic gradient overlays.

### Core Character Traits
*   **Dignified & Confident**: Understated elegance, generous negative space, purposeful typography, and quiet luxury.
*   **Warm & Sensorial**: Earthy plum grounds (`#161016`), soft parchment surfaces (`#FDFBF7`), and antique champagne-gold accents (`#D6A85E`).
*   **Food as the Hero**: Food photography commands the focal plane, treated with cinematic warmth and editorial framing.

---

## 2. Visual Principles

1.  **Visual Hierarchy Above All**: Every screen presents a distinct focal point. Headlines lead the eye naturally into descriptions and decisive calls to action.
2.  **Harmonious Dual Palettes**:
    *   *Customer Experience*: Rich nocturnal plum and warm amber gold creating an intimate, candlelit dining atmosphere.
    *   *Admin Operations*: Clean parchment canvas, rich espresso text, and high-contrast operational status accents engineered for speed and readability under kitchen lighting.
3.  **Restraint in Motion**: Transitions are silky and swift (200ms–300ms using `cubic-bezier(0.23, 1, 0.32, 1)`). Animation informs state change; it never distracts from commerce.

---

## 3. Typography & Font Hierarchy

The typographic system pairs an editorial high-contrast serif for dining elegance with a geometric, legible sans-serif for commerce details, and a monospace font for financial receipts and order identifiers.

*Table 1 – Typography System & Usage Matrix*

| Type Level | Font Family | Size | Weight | Tracking | Line Height | Usage |
|---|---|---|---|---|---|---|
| **Display Hero** | `Playfair Display`, serif | 4.5rem – 8rem (72px–128px) | 400 Light / Regular | -0.05em | 0.92 | Primary landing hero narrative |
| **Heading 1** | `Playfair Display`, serif | 2.5rem – 3.75rem (40px–60px) | 500 Medium | -0.04em | 1.05 | Page titles, major section anchors |
| **Heading 2** | `Playfair Display`, serif | 1.75rem – 2.25rem (28px–36px) | 600 SemiBold | -0.02em | 1.15 | Category titles, modal headers |
| **Heading 3** | `Playfair Display`, serif | 1.25rem – 1.5rem (20px–24px) | 600 SemiBold | 0.0em | 1.25 | Dish titles, order card headers |
| **Subheading / Kicker**| `Manrope`, sans-serif | 0.6875rem – 0.75rem (11px–12px)| 600 SemiBold | 0.24em | 1.0 | Uppercase kickers, section labels |
| **Body Large** | `Manrope`, sans-serif | 1.0rem – 1.125rem (16px–18px) | 400 Regular | -0.01em | 1.65 | Brand story, culinary descriptions |
| **Body Standard** | `Manrope`, sans-serif | 0.875rem (14px) | 400 / 500 | 0.0em | 1.5 | Dish descriptions, operational data |
| **Caption / Fine** | `Manrope`, sans-serif | 0.75rem (12px) | 500 Medium | 0.02em | 1.4 | Helper notes, timestamps, fees |
| **Monospace / Metric** | `DM Mono`, monospace | 0.8125rem – 1.0rem (13px–16px) | 500 Medium | 0.05em | 1.0 | Prices, UTR numbers, Order # |

---

## 4. Color Architecture & Palettes

*Table 2 – Curated Color Tokens & Specifications*

| Token Name | Hex Code | Purpose & Semantic Application |
|---|---|---|
| `--color-plum-void` | `#161016` | Customer portal background: deep, immersive night canvas. |
| `--color-plum-surface`| `#211721` | Customer card & secondary panel elevation. |
| `--color-plum-elevated`| `#2B1D2B` | Customer modal, drawer, and elevated popover surface. |
| `--color-champagne-gold`| `#D6A85E` | Signature accent: brand highlights, primary active states, star ratings. |
| `--color-gold-muted` | `#F4D59B` | Subdued gold for secondary badges and highlighted prices. |
| `--color-cream-base` | `#F8F1E8` | Primary text color on customer dark background. |
| `--color-cream-muted` | `#A69698` | Secondary explanatory text and inactive icons. |
| `--color-admin-bg` | `#FAF6F0` | Admin console foundation: clean, warm parchment canvas. |
| `--color-admin-card` | `#FFFFFF` | Admin operational cards, order tickets, and data tables. |
| `--color-admin-text` | `#1F171A` | Admin primary high-contrast typography. |
| `--color-status-new` | `#3B82F6` | Informational status: incoming order queue. |
| `--color-status-prep`| `#EAB308` | In-progress status: kitchen preparing food. |
| `--color-status-ready`| `#10B981` | Success status: order packaged, ready for pickup/dispatch. |
| `--color-status-alert`| `#EF4444` | Urgent status: payment rejected, order cancelled. |

---

## 5. Spatial System, Grids & Breakpoints

*   **Spatial Unit (4px / 8px Grid)**:
    *   `space-1`: 4px (tight grouping, badge padding)
    *   `space-2`: 8px (icon-to-text spacing, input internal padding)
    *   `space-3`: 12px (form row gaps, micro-card padding)
    *   `space-4`: 16px (standard component padding)
    *   `space-6`: 24px (card internal padding, desktop gaps)
    *   `space-8`: 32px (section sub-headers, table row padding)
    *   `space-12`: 48px (major section gutters)
    *   `space-20`: 80px (desktop section division)
    *   `space-32`: 128px (dramatic hero spacing)
*   **Responsive Breakpoints**:
    *   `320px` (Compact mobile: single column, sticky bottom cart bar)
    *   `375px` & `430px` (Standard modern mobile: optimized thumb navigation)
    *   `768px` (Tablet / iPad: 2-column menu grids, split drawers)
    *   `1024px` (Laptop: 3-column menu grids, persistent sidebar layout)
    *   `1440px+` (Large desktop: centered 1280px container with generous margins)

---

## 6. Elevation, Radii & Depth

*   **Corner Radii**:
    *   `rounded-sm`: 6px (fine badges, status pills)
    *   `rounded-md`: 10px (input fields, select boxes)
    *   `rounded-lg`: 16px (buttons, operational table containers)
    *   `rounded-xl`: 24px (dish cards, admin dashboard tiles)
    *   `rounded-2xl`: 32px (hero containers, modal dialogs)
    *   `rounded-full`: 9999px (action pills, quantity circles, category chips)
*   **Elevation & Shadows**:
    *   `shadow-subtle`: `0 2px 8px -2px rgba(0, 0, 0, 0.25)` (cards at rest)
    *   `shadow-hover`: `0 12px 28px -6px rgba(0, 0, 0, 0.45)` (cards on hover)
    *   `shadow-modal`: `0 24px 64px -12px rgba(0, 0, 0, 0.65)` (slide-out cart, checkout sheet)

---

## 7. Component Specifications

### 7.1 Buttons & Interactive Controls
*   **Primary Action**: Solid champagne gold (`#D6A85E`), rich plum text (`#161016`), bold weight, pill-shaped (`rounded-full`), subtle translateY(-1px) hover effect.
*   **Secondary Outline**: Border `1px solid rgba(214, 168, 94, 0.4)`, gold text, transparent background, background fills on hover.
*   **Ghost Control**: Borderless, subtle cream hover tint, reserved for cancellations or dismissals.

### 7.2 Form Fields & Inputs
*   **Customer Fields**: Transparent background with `1px solid rgba(255, 255, 255, 0.15)`, focus ring in gold (`#D6A85E`), placeholder in muted cream.
*   **Admin Operational Fields**: Crisp white background, `1px solid rgba(0, 0, 0, 0.12)`, dark charcoal text, clear focus state.

### 7.3 Cards & Dish Display Tiles
*   Aspect ratio for hero food photography: 4:3 or 1:1 square.
*   Dishes feature:
    *   Dietary badge top-left (*Veg* green border / *Non-Veg* red border / *Jain* gold border).
    *   Prep time pill top-right (*25m*).
    *   Dish title in Playfair Display serif.
    *   Curated single-sentence culinary description.
    *   Prominent price display in `DM Mono`.
    *   High-contrast "Add +" action button.

### 7.4 Modals & Cart Drawer
*   Cart slides in from the right edge with backdrop blur (`backdrop-blur-md bg-black/60`).
*   Displays real-time line item recalculation, dietary icons, customization modifiers, fee breakdown, and large checkout trigger.

---

## 8. States: Loading, Skeletons, Empty & Error Handling

*   **Loading & Skeletons**:
    *   Smooth pulse animation in warm plum-tinted slate (`bg-white/5` on dark, `bg-black/5` on light).
    *   Preserves exact layout dimensions to avoid Cumulative Layout Shift (CLS = 0).
*   **Empty States**:
    *   Dignified editorial artwork (fine-line brass bowl or spark iconography).
    *   Thoughtful copywriting (e.g., *"Your table is waiting. Add something memorable from our live-fire menu."*).
*   **Error States**:
    *   Inline, non-intrusive alert banners in burnt terracotta (`#C4583F`) with specific recovery guidance.
    *   No raw technical error messages or stack traces exposed.

---

## 9. Image Treatment & Art Direction

*   **Color Tone**: Warm, directional sidelight evocative of live tandoori fire, golden hour candlelight, and gleaming brass tableware.
*   **Framing**: Macro close-ups of charred spices, slow-simmered lentils, and artisan breads; contextual wide shots of intimate dining rooms.
*   **Technical Optimization**: All raster images compressed into next-gen **WebP** format with responsive `srcset` definitions and lazy-loading enabled below the fold.

---

## 10. Motion, Hover & Micro-Interactions

*   Hover transitions: `transform 250ms cubic-bezier(0.23, 1, 0.32, 1)`.
*   Buttons gently compress (`active:scale-95`) to provide immediate tactile feedback on touch devices.
*   Drawer opening: Silky spring glide from screen right (300ms).
*   Sound: Gentle operational chime on arrival of new orders in the kitchen console (user-togglable).

---

## 11. Accessibility (WCAG 2.2 AA)

*   **Color Contrast**: All text pairings achieve at least `4.5:1` contrast ratio for normal text and `3:1` for large display headings.
*   **Keyboard Navigation**: Full focus trap inside open modals and cart drawers; visible outline ring on Tab navigation.
*   **Screen Readers**: Semantic tags (`<main>`, `<nav>`, `<article>`, `<header>`) and explicit ARIA labels on icon buttons.
*   **Reduced Motion**: All animations wrapped in `@media (prefers-reduced-motion: reduce)` to deliver zero-motion instant transitions for sensitive users.

---

## 12. Customer vs. Admin Experience Paradigm

*   **Customer Experience (Emotional & Luxury)**:
    *   Goal: Inspire appetite, build brand loyalty, provide frictionless ordering.
    *   Design Language: Sensory, warm, spacious, high typographic flair, intimate ambient dark tones.
*   **Admin Experience (Operational & Efficient)**:
    *   Goal: Process orders instantly, verify payments without hesitation, eliminate kitchen bottlenecks.
    *   Design Language: High contrast, maximum information density, clear visual status indicators, zero decorative distractions.
