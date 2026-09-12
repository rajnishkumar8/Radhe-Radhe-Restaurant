import { describe, expect, it } from "vitest";
import { securityHeaders } from "./_core/security";

describe("security headers", () => {
  it("sets defensive browser policies", () => {
    const headers = new Map<string, string>();
    const res = { setHeader: (name: string, value: string) => headers.set(name, value) } as any;
    securityHeaders({ headers: {} } as any, res, () => undefined);
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
  });
});
