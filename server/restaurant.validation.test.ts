import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const ctx = { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext;

describe("customer.placeOrder", () => {
  it("rejects an empty cart before touching the database", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(caller.customer.placeOrder({ customerName: "A guest", customerPhone: "9876543210", fulfillmentType: "pickup", paymentMethod: "pay_at_pickup", items: [] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects invalid phone input", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(caller.customer.placeOrder({ customerName: "A guest", customerPhone: "12", fulfillmentType: "pickup", paymentMethod: "pay_at_pickup", items: [{ menuItemId: 1, nameSnapshot: "Paneer", priceSnapshot: "420", quantity: 1 }] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects delivery without a complete address", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(caller.customer.placeOrder({ customerName: "A guest", customerPhone: "9876543210", fulfillmentType: "delivery", paymentMethod: "cash_on_delivery", items: [{ menuItemId: 1, nameSnapshot: "Paneer", priceSnapshot: "420", quantity: 1 }] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects delivery with pay-at-pickup", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(caller.customer.placeOrder({ customerName: "A guest", customerPhone: "9876543210", fulfillmentType: "delivery", paymentMethod: "pay_at_pickup", addressSnapshot: "Lohna Road, Dharampur, Manigachhi, Darbhanga", items: [{ menuItemId: 1, nameSnapshot: "Paneer", priceSnapshot: "420", quantity: 1 }] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
