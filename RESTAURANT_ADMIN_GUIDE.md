# Shri Radhe Radhe Restaurant — Administrator & Operations Manual
*Commercial Digital Platform Operational Guidebook*

---

<!-- Dynamic TOC SDT Block: Open Sans 11 Pt, Dot Leader (. . . . . .) to Right-Aligned Pos 9350 dxa -->
## Table of Contents
* **1. Introduction & Executive Overview** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 1
* **2. Daily Operational Routine & Live Order Workflow** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 2
    * 2.1 Order Status Transitions & Dispatch . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 2
    * 2.2 Cancelling or Rejecting an Order . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 3
* **3. Direct UPI Payment Verification Desk** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 4
    * 3.1 Auditing the 12-Digit Bank UTR / Reference ID . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 4
    * 3.2 Approving and Rejecting Claims . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 5
* **4. Menu Management & Digital CMS** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 6
    * 4.1 Adding a New Dish . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 6
    * 4.2 Updating Prices & Promotional Discounts . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 7
    * 4.3 86-ing / Marking Dishes "Sold Out" in Realtime . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 8
* **5. Kitchen Capacity & Emergency Controls** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 9
    * 5.1 Emergency Switch: Pausing Online Orders . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 9
    * 5.2 Kitchen Busy Modes & Dynamic Prep Times . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 10
* **6. Marketing, Promotions & Coupons** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 11
* **7. Delivery Fleet Monitoring & Driver Dispatch** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 12
* **8. Business Analytics & Financial Auditing** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 13
* **9. Role-Based Staff Management & Security** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 14
* **10. Payment Gateway Migration (Activating Razorpay)** . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 15

---

## 1. Introduction & Executive Overview

Welcome to the digital operations platform for **Shri Radhe Radhe Restaurant** (Near Radhe Communication, Lohna Road, Dharampur, Manigachhi, Darbhanga, Bihar). This platform transforms your restaurant into a no-code digital commerce powerhouse. As an owner or manager, you have full control over your menu, pricing, live orders, discount campaigns, delivery fleet, and payment verification directly from the `/admin` portal without writing a single line of code.

```
+-----------------------------------------------------------------------------------+
|               SHRI RADHE RADHE RESTAURANT - UNIFIED OPERATIONS ECOSYSTEM          |
|                                                                                   |
|  [ Public Storefront ]  <--->  [ Order Engine ]  <--->  [ Admin / Kitchen Desk ]  |
|   - Luxury Brand UI             - Authoritative Cart      - Audio Alerts          |
|   - Realtime Menu               - Snapshot Immutability   - Status Lifecycle      |
|   - Dynamic UPI QR              - Fraud Prevention        - 1-Click Verification  |
+-----------------------------------------------------------------------------------+
```
<div align="center">
<p style="font-size: 10pt; font-style: italic; color: #4A5568;">Figure 1 – Architectural Flow of the Restaurant Digital Commerce Engine</p>
</div>

---

## 2. Daily Operational Routine & Live Order Workflow

When your kitchen opens each morning, open the **Live Order Operations** tab (`/admin`). The interface streams orders in real time with distinct visual states and alert chimes.

### 2.1 Order Status Transitions & Dispatch
Every incoming order progresses through an intentional operational lifecycle. Staff must advance tickets in order:

<div align="center">

| Status Badge | Operational Meaning | Staff Action Required | Next Allowed State |
| :--- | :--- | :--- | :--- |
| **Pending Payment** | Customer created cart; awaiting payment claim. | Wait for customer to submit UPI UTR or choose COD. | `Payment Claimed` or `Cancelled` |
| **Payment Claimed** | Customer entered a 12-digit UPI reference ID. | Cross-check bank account (Section 3). | `Payment Verified` or `Payment Rejected` |
| **Received** | Order confirmed and ready for kitchen review. | Review order details, allergies, and click **Accept**. | `Preparing` |
| **Preparing** | Kitchen is firing the tandoor and cooking items. | Monitor prep timer badge on ticket. | `Ready` |
| **Ready** | Order is packed, sealed, and staged at pass. | Assign to delivery driver or stage for pickup counter. | `Out for Delivery` or `Delivered` |
| **Out for Delivery** | Driver is en-route; live GPS telemetry active. | Monitor driver location on live vector map. | `Delivered` |
| **Delivered** | Customer received their meal; ticket closed. | None. GPS tracking terminates automatically. | Archive |

</div>
<div align="center">
<p style="font-size: 10pt; font-style: italic; color: #4A5568;">Table 1 – Standard Operating Order Status Progression Matrix</p>
</div>

### 2.2 Cancelling or Rejecting an Order
To cancel an order (e.g. out of stock or unreachable customer):
*   **Locate Ticket**: Click on the order card in the Live Orders board.
*   **Select Action**: Click the red **Reject / Cancel Order** button.
*   **Document Reason**: Choose or type the cancellation reason (e.g. *"Customer requested cancellation before prep started"*).
*   **System Action**: The customer's order status immediately updates to `Cancelled`, and an immutable entry is recorded in the Audit Log with your user ID and timestamp.

---

## 3. Direct UPI Payment Verification Desk

The Direct UPI payment desk eliminates 2–3% gateway transaction fees by routing funds directly into your restaurant's bank account via BHIM / Google Pay / PhonePe / Paytm.

### 3.1 Auditing the 12-Digit Bank UTR / Reference ID
When a customer pays via Direct UPI, their phone generates a 12-digit **Unique Transaction Reference (UTR)**. The customer types this UTR into the confirmation screen.

> **CRITICAL SECURITY DIRECTIVE**: A customer submitting a UTR is a *claim of payment*, not cryptographic proof of settlement. Never hand food to a delivery driver or pickup guest until staff has confirmed funds in the restaurant's UPI app or bank SMS.

### 3.2 Approving and Rejecting Claims
1. Open the **Payments Verification Queue** tab in `/admin`.
2. Review the pending claim card:
    * **Customer Name & Phone Number**
    * **Calculated Server Total** (e.g., ₹898.00)
    * **Submitted 12-Digit UPI Reference** (e.g., `425619882103`)
    * **Screenshot Proof** (if uploaded by customer)
3. Open your restaurant's business UPI application (SBI/HDFC/ICICI Merchant App, Google Pay for Business, or PhonePe Business).
4. Verify that an incoming credit matching the **exact amount** and **UTR** exists.
5. Click **Verify Payment**:
    * Order status transitions to `Accepted` automatically.
    * Kitchen ticket chiming initiates.
6. If no payment was received:
    * Click **Reject Payment**.
    * Type the explanation (e.g., *"UTR not found in bank statement as of 21:45"*).
    * Customer's screen reflects payment rejection and prompts them to re-verify or choose another method.

---

## 4. Menu Management & Digital CMS

You can manage all dishes, pricing, photographs, and availability without developer assistance.

### 4.1 Adding a New Dish
1. Navigate to `/admin` -> **Menu CMS** -> **+ Add Dish**.
2. Complete the standardized dish properties:
    * **Dish Name**: Clear, appealing title (e.g., *"Rajasthani Gatta Curry"*).
    * **Category**: Select existing category (Starters, Royal Curries, Tandoori Breads, Desserts).
    * **Base Price**: Price in Indian Rupees (e.g., `380.00`).
    * **Promotional Discount Price**: (Optional) Strikethrough promotional price (e.g., `340.00`).
    * **Dietary Classification**: Veg, Jain, Vegan, or Egg.
    * **Spice Rating**: 0 (Mild), 1 (Medium), 2 (Hot), or 3 (Royal Fiery).
    * **Preparation Time**: Kitchen cooking estimate in minutes (default: 25 mins).
    * **Photograph**: Upload a high-resolution WebP or JPEG photograph.
3. Click **Save Dish**. The item instantly appears on the public storefront.

### 4.2 Updating Prices & Promotional Discounts
* To change a price, click the **Edit** icon on any dish row.
* Change the **Base Price** or **Discount Price**.
* Click **Update**.
* **Historical Guarantee**: Changing a price today will **never** alter previous customer orders. Previous invoices maintain their snapshot prices immutably.

### 4.3 86-ing / Marking Dishes "Sold Out" in Realtime
When an item runs out during rush hour:
* Locate the dish in the Menu CMS.
* Toggle the **Available** switch to **OFF**.
* The dish immediately shows a *"Sold Out"* badge on the public menu, and customer cart additions for that item are blocked instantly.

---

## 5. Kitchen Capacity & Emergency Controls

### 5.1 Emergency Switch: Pausing Online Orders
When the kitchen is overwhelmed or during sudden weather emergencies:
1. Navigate to `/admin` -> **Settings** -> **Emergency Controls**.
2. Toggle **Pause Online Ordering** to **ON**.
3. Type a courteous message for your guests (e.g., *"Our kitchen is currently at peak capacity for in-house banquets. Online ordering will resume at 8:30 PM."*).
4. **Behavior**: Customers can still browse your culinary story and menu, but checkout is gracefully disabled with your custom announcement.

### 5.2 Kitchen Busy Modes & Dynamic Prep Times
Adjust the operational tempo with a single click:

<div align="center">

| Mode | Base Prep Estimate | When to Use | Customer Display Banner |
| :--- | :--- | :--- | :--- |
| **Normal** | 25–35 minutes | Standard weekday operations. | *"Freshly prepared in 30 mins"* |
| **Busy** | 45–55 minutes | Weekend evenings or rain rush. | *"High kitchen demand: prep time ~50 mins"* |
| **Very Busy** | 65–80 minutes | Festival rush, Diwali, or New Year's Eve. | *"Peak festival volume: prep time ~75 mins"* |

</div>
<div align="center">
<p style="font-size: 10pt; font-style: italic; color: #4A5568;">Table 2 – Kitchen Load Level Configuration Matrix</p>
</div>

---

## 6. Marketing, Promotions & Coupons

Drive sales during off-peak hours using targeted promotional coupons.

### 6.1 Creating a Promotional Voucher
1. Open `/admin` -> **Coupons** -> **+ New Promo Code**.
2. Fill in the coupon specifications:

*   **Coupon Code**: Alphanumeric uppercase promo code (e.g., `RADHE100`).
    *   *Calculation:* Customer enters this exact code in their cart drawer.
*   **Discount Type**:
    *   *Percentage:* e.g., 15% discount on eligible subtotal.
    *   *Flat Amount:* e.g., ₹50 or ₹100 direct deduction.
    *   *Free Delivery:* Waives the delivery fee.
*   **Minimum Order Value**: Minimum cart requirement before discount applies (e.g., `499.00`).
*   **Maximum Discount Cap**: Ceils the discount amount for percentage coupons (e.g., Max `₹150.00`).
*   **Usage Limits**: Total coupon redemptions allowed across all users, and per-customer limit (e.g., 1 per customer).

---

## 7. Delivery Fleet Monitoring & Driver Dispatch

Keep customers informed and avoid phone calls asking *"Where is my food?"*

1. **Driver Assignment**: When an order status reaches `Ready`, assign the delivery to an authorized driver from the dropdown.
2. **Driver PWA Activation**: The driver opens `/driver` on their smartphone, sees the pickup address and customer location, and taps **Start Delivery**.
3. **Telemetry Streaming**: The driver's device securely transmits GPS coordinates every 10 seconds.
4. **Customer Live Map**: The customer tracks their driver's vehicle marker approaching in real time on an OpenFreeMap vector map.
5. **Privacy Safeguard**: The moment the driver taps **Mark Delivered**, GPS coordinates cease transmitting and customer access to driver tracking is permanently revoked.

---

## 8. Business Analytics & Financial Auditing

The Executive Dashboard provides actionable insights without vanity metrics:
*   **Gross Platform Revenue**: Total settled sales across Direct UPI and COD.
*   **Average Order Value (AOV)**: Track upsell performance.
*   **Hourly Order Distribution**: Identify staffing peaks (typically 1:00 PM – 3:30 PM and 8:00 PM – 10:30 PM).
*   **Top 5 Best-Selling Dishes**: High-margin menu items for kitchen prep planning.
*   **Immutable Audit Log**: Review every administrative modification with actor details, timestamps, and previous/new values.

---

## 9. Role-Based Staff Management & Security

Protect your business with strict least-privilege security roles:

<div align="center">

| System Role | Permitted Access Scope | Prohibited Actions |
| :--- | :--- | :--- |
| **Owner** | Unrestricted access to all financials, settings, staff credentials, and menu items. | None. |
| **Manager** | Live orders, payment verification desk, menu adjustments, and daily analytics. | Changing bank UPI account or deleting staff users. |
| **Order Staff** | Live orders board, advancing tickets from Accepted to Ready, and printing receipts. | Modifying menu prices, accessing revenue analytics, or adjusting settings. |
| **Delivery Driver** | Viewing assigned active delivery tickets and transmitting live GPS coordinates. | Viewing other drivers' deliveries, modifying orders, or viewing customer accounts. |

</div>
<div align="center">
<p style="font-size: 10pt; font-style: italic; color: #4A5568;">Table 3 – Operational Role-Based Access Control (RBAC) Permissions</p>
</div>

---

## 10. Payment Gateway Migration (Activating Razorpay)

When your transaction volume justifies automated payment gateway fees:
1. Obtain your **Razorpay Key ID** and **Key Secret** from your Razorpay Merchant Dashboard.
2. Add these to your server environment variables (`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`).
3. Open `/admin` -> **Settings** -> **Payment Gateways**.
4. Toggle **Razorpay Automated Gateway** to **ON**.
5. Customers will now see automated Credit/Debit Card, Netbanking, and UPI checkout options alongside Direct UPI. Zero redesign or downtime required.
