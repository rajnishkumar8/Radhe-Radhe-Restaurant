import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const userContext = { user: { id: 9, openId: "customer", name: "Customer", email: "customer@example.com", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;

describe("admin access", () => {
  it("rejects a regular customer from the operations summary", async () => {
    const caller = appRouter.createCaller(userContext);
    await expect(caller.operations.summary()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
