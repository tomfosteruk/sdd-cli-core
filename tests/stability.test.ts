import { describe, it, expect } from "vitest";
import {
  checkStabilityClass,
  type StabilityContext,
  type StabilityCheckResult,
} from "../src/stability/index.js";

describe("stability surface", () => {
  it("checkStabilityClass throws an unimplemented error in v0.1.0", async () => {
    const ctx: StabilityContext = {
      tier: "production",
      pinnedArtefacts: [],
      allowProvisional: false,
    };
    await expect(checkStabilityClass(ctx)).rejects.toThrow(
      /not implemented in v0\.1\.0/,
    );
  });

  it("result type compiles", () => {
    const sample: StabilityCheckResult = { status: "pass", violations: [] };
    expect(sample.status).toBe("pass");
  });
});
