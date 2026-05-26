/**
 * Cross-SDD contract-pin verb delegation per ADR 0110.
 *
 * v0.1.0 ships the shape. Runtime delegation to the ADR 0110
 * consumer-manifest surface is deferred — adopters implementing
 * contract-pin verbs today should compose against this shape and
 * provide their own runtime until the upstream implementation lands.
 */

export interface ContractsVerbOptions {
  subcommand: "list" | "check" | "probe" | "upgrade";
}

export interface ContractsVerbResult {
  status: "unimplemented";
  message: string;
}

export async function runContractsVerb(
  _options: ContractsVerbOptions,
): Promise<ContractsVerbResult> {
  throw new Error(
    "runContractsVerb: not implemented in v0.1.0. The contracts verb shape is documented per ADR 0110; runtime delegation lands in a later release.",
  );
}
