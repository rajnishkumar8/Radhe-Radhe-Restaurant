import { describe, expect, it } from "vitest";

// Shopify is retained only as a future migration seam. The approved launch path
// is self-contained and must not require a Shopify store or paid commerce setup.
describe.skip("legacy Shopify smoke test", () => {
  it("remains disabled until a future provider migration is explicitly enabled", () => {
    expect(true).toBe(true);
  });
});
