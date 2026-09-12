import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { hashPassword, verifyPassword, verifyAndUpgradeUserPassword, findUserByIdentifier, upsertUser } from "./db";

function createMockContext(user?: any) {
  const cookies: Record<string, any> = {};
  return {
    user: user || null,
    req: {
      headers: {},
      cookies,
      protocol: "http",
      get: (h: string) => (h === "host" ? "localhost:3000" : undefined),
    } as any,
    res: {
      cookie: (name: string, val: string, options: any) => {
        cookies[name] = val;
      },
      clearCookie: (name: string) => {
        delete cookies[name];
      },
    } as any,
  };
}

describe("Security & Authentication: Password Hashing and Access Controls", () => {
  it("hashes passwords securely with bcrypt", async () => {
    const raw = "MithilaSpecial@2026";
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);

    const isMatch = await verifyPassword(raw, hash);
    expect(isMatch).toBe(true);

    const isWrong = await verifyPassword("WrongPassword123", hash);
    expect(isWrong).toBe(false);
  });

  it("handles legacy plain text passwords and upgrades them on successful login", async () => {
    const phone = `+9199999${Math.floor(10000 + Math.random() * 90000)}`;
    const user = await upsertUser({
      authUserId: `legacy_test_${Date.now()}`,
      name: "Legacy Diner",
      phone,
      role: "customer",
      lastSignedIn: new Date(),
    });

    // Manually set plain text legacy password
    user.passwordHash = "PlainPassword@123";

    // First login should verify and auto-upgrade
    const valid = await verifyAndUpgradeUserPassword(user, "PlainPassword@123");
    expect(valid).toBe(true);
    expect(user.passwordHash?.startsWith("$2a$") || user.passwordHash?.startsWith("$2b$")).toBe(true);

    // Subsequent check should verify using the newly upgraded bcrypt hash
    const secondValid = await verifyPassword("PlainPassword@123", user.passwordHash!);
    expect(secondValid).toBe(true);
  });

  it("registers a customer with bcrypt password and authenticates correctly", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const phone = `+9188888${Math.floor(10000 + Math.random() * 90000)}`;
    const password = "SecureDiner@999";

    const regResult = await caller.auth.customerRegister({
      name: "Radha Raman",
      phone,
      password,
    });

    expect(regResult.success).toBe(true);
    expect(regResult.profile.name).toBe("Radha Raman");

    // Login with wrong password should fail
    await expect(
      caller.auth.customerLogin({
        identifier: phone,
        password: "IncorrectPassword",
      })
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    // Login with correct password should succeed
    const loginResult = await caller.auth.customerLogin({
      identifier: phone,
      password,
    });

    expect(loginResult.success).toBe(true);
    expect(loginResult.token).toBeTruthy();
  });

  it("blocks loginAsRole backdoor when NODE_ENV is production", async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const caller = appRouter.createCaller(createMockContext());
      await expect(
        caller.auth.loginAsRole({
          role: "owner",
        })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  it("provides non-sensitive public settings without requiring authentication", async () => {
    const unauthCaller = appRouter.createCaller(createMockContext());
    const publicSettings = await unauthCaller.restaurant.publicSettings();

    expect(publicSettings.restaurantName).toBeTruthy();
    expect(publicSettings.phone).toBeTruthy();
    expect(publicSettings.address).toBeTruthy();
    expect(typeof publicSettings.orderingPaused).toBe("boolean");
  });
});
