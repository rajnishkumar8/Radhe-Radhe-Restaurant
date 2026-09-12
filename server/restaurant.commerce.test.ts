import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function makeContext(role: "admin" | "user" | null = null, userId = 1, openId = "user_1"): TrpcContext {
  return {
    user: role
      ? {
          id: userId,
          openId,
          name: role === "admin" ? "Rajesh Sharma (Owner)" : "Test Customer",
          email: `${role}@radheradhe.com`,
          role,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        }
      : null,
    req: {} as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("Restaurant Commerce Architecture", () => {
  const publicCaller = appRouter.createCaller(makeContext(null));
  const customerCaller = appRouter.createCaller(makeContext("user", 42, "cust_42"));
  const adminCaller = appRouter.createCaller(makeContext("admin", 1, "admin_1"));
  const driverCaller = appRouter.createCaller(makeContext("driver", 3, "driver_1"));

  describe("Cart & Server-Authoritative Pricing", () => {
    it("authoritatively computes cart subtotals and discounts from database prices", async () => {
      // Menu item 1 is Royal Dal Makhani (effective discounted price: ₹320.00)
      const calculation = await publicCaller.cart.calculate({
        items: [{ menuItemId: 1, quantity: 2 }],
        fulfillmentType: "delivery",
        couponCode: "WELCOME50", // Flat ₹50 off on carts >= ₹299
      });

      expect(calculation.lines).toHaveLength(1);
      expect(calculation.lines[0].unitPrice).toBe(320);
      expect(calculation.lines[0].lineTotal).toBe(640);
      expect(calculation.subtotal).toBe("640.00");
      expect(calculation.discountAmount).toBe("50.00");
      expect(Number(calculation.taxAmount)).toBeGreaterThan(0);
      expect(Number(calculation.totalAmount)).toBeGreaterThan(0);
    });

    it("handles invalid or expired coupon codes gracefully without breaking calculation", async () => {
      const calculation = await publicCaller.cart.calculate({
        items: [{ menuItemId: 1, quantity: 1 }],
        fulfillmentType: "pickup",
        couponCode: "NONEXISTENT_COUPON_123",
      });

      expect(calculation.subtotal).toBe("320.00");
      expect(calculation.discountAmount).toBe("0.00");
      expect(calculation.deliveryFee).toBe("0.00"); // Pickup has 0 delivery fee
    });
  });

  describe("Order Placement & Payment Workflow", () => {
    it("creates an order, snapshots items immutably, and generates UPI payment intent", async () => {
      const order = await customerCaller.customer.placeOrder({
        customerName: "Radha Gupta",
        customerPhone: "9829012345",
        fulfillmentType: "delivery",
        paymentMethod: "direct_upi",
        addressSnapshot: "Near Radhe Communication, Lohna Road, Dharampur, Manigachhi, Darbhanga 847407",
        items: [{ menuItemId: 1, quantity: 1 }],
      });

      expect(order).toBeDefined();
      expect(order.id).toBeGreaterThan(0);
      expect(order.orderNumber).toMatch(/^RR-/);
      expect(order.fulfillmentType).toBe("delivery");
      expect(order.paymentStatus).toBe("payment_initiated");
      expect(order.orderStatus).toBe("pending_payment");
      expect(order.subtotal).toBe("320.00");

      // Verify UPI Intent generation
      const upiIntent = await publicCaller.payment.getUpiIntent({ orderId: order.id });
      expect(upiIntent).toBeDefined();
      expect(upiIntent.intentUrl).toContain("upi://pay");
      expect(upiIntent.upiId).toBeDefined();
      expect(upiIntent.amount).toBe(order.totalAmount);

      // Customer submits UPI reference ID (claim)
      const paymentRecord = await customerCaller.payment.claimPayment({
        orderId: order.id,
        upiReference: "123456789012",
      });
      expect(paymentRecord).toBeDefined();
      expect(paymentRecord.id).toBeGreaterThan(0);

      // Verify order status updated to payment_claimed
      const updatedOrder = await customerCaller.customer.getOrder({ orderId: order.id });
      expect(updatedOrder.paymentStatus).toBe("payment_claimed");

      // Customer cannot verify their own payment
      await expect(
        customerCaller.operations.verifyPayment({
          paymentId: paymentRecord.id,
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      // Admin staff verifies the payment
      const verified = await adminCaller.operations.verifyPayment({
        paymentId: paymentRecord.id,
      });
      expect(verified.success).toBe(true);

      const verifiedOrder = await customerCaller.customer.getOrder({ orderId: order.id });
      expect(verifiedOrder.paymentStatus).toBe("payment_verified");
      expect(verifiedOrder.orderStatus).toBe("accepted");
    });
  });

  describe("Driver Tracking & GPS Security", () => {
    it("forbids non-driver/non-staff users from transmitting driver GPS coordinates", async () => {
      await expect(
        customerCaller.driver.sendLocationPing({
          orderId: 1,
          latitude: "26.9124",
          longitude: "75.7873",
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("allows authorized staff to stream GPS updates for an active order", async () => {
      const update = await driverCaller.driver.sendLocationPing({
        orderId: 1,
        latitude: "26.9124",
        longitude: "75.7873",
        accuracy: 10,
      });

      expect(update.success).toBe(true);

      // Customer can query tracking status
      const tracking = await publicCaller.tracking.getLiveStatus({ orderId: 1 });
      expect(tracking).toBeDefined();
      expect(tracking.orderNumber).toBeDefined();
      expect(tracking.restaurantCoords).toHaveLength(2);
    });
  });

  describe("Role-Based Access Control (RBAC) & Administrative Control", () => {
    it("forbids regular customers from mutating restaurant settings or pausing orders", async () => {
      await expect(
        customerCaller.admin.updateSettings({
          orderingPaused: true,
          orderingPauseMessage: "Emergency closure test",
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("allows admin to pause online orders and enforces refusal of new orders", async () => {
      // Admin pauses online orders
      await adminCaller.admin.updateSettings({
        orderingPaused: true,
        orderingPauseMessage: "Kitchen at full capacity for private banquet event.",
      });

      // Customer attempts to place an order while paused -> must reject
      await expect(
        customerCaller.customer.placeOrder({
          customerName: "Pooja Verma",
          customerPhone: "9829012347",
          fulfillmentType: "pickup",
          paymentMethod: "pay_at_pickup",
          items: [{ menuItemId: 1, quantity: 1 }],
        })
      ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

      // Admin resumes orders
      await adminCaller.admin.updateSettings({
        orderingPaused: false,
      });

      // Now customer can place order again
      const order = await customerCaller.customer.placeOrder({
        customerName: "Pooja Verma",
        customerPhone: "9829012347",
        fulfillmentType: "pickup",
        paymentMethod: "pay_at_pickup",
        items: [{ menuItemId: 1, quantity: 1 }],
      });
      expect(order.orderNumber).toBeDefined();
    });

    it("records and exposes audit logs for sensitive operations to authorized administrators", async () => {
      const logs = await adminCaller.admin.auditLogs();
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
    });
  });
});
