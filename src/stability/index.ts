/**
 * Stability-class surfacing surface per ADR 0118 §4.5 + ADR 0127.
 *
 * v0.1.0 ships the shape (types + entry point). Runtime implementation
 * is deferred to a later release — adopters implementing stability-class
 * gating today should compose against this shape and provide their own
 * checker until the upstream implementation lands.
 */

export interface StabilityContext {
  tier: string;
  pinnedArtefacts: ReadonlyArray<{
    id: string;
    stabilityClass: "provisional" | "locked";
  }>;
  allowProvisional: boolean;
}

export interface StabilityCheckResult {
  status: "pass" | "refuse" | "warn";
  violations: string[];
}

export async function checkStabilityClass(
  _context: StabilityContext,
): Promise<StabilityCheckResult> {
  throw new Error(
    "checkStabilityClass: not implemented in v0.1.0. The stability-class shape is documented per ADR 0118 §4.5 + ADR 0127; runtime implementation lands in a later release.",
  );
}
