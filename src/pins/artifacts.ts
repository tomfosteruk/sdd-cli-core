/**
 * Runtime artefact-pin verb delegation per ADR 0113.
 *
 * v0.1.0 ships the shape. Runtime delegation to the ADR 0113
 * drift-detection surface is deferred — adopters implementing
 * artefact-pin verbs today should compose against this shape and
 * provide their own runtime until the upstream implementation lands.
 */

export interface ArtifactsVerbOptions {
  subcommand: "list" | "check" | "probe" | "upgrade";
}

export interface ArtifactsVerbResult {
  status: "unimplemented";
  message: string;
}

export async function runArtifactsVerb(
  _options: ArtifactsVerbOptions,
): Promise<ArtifactsVerbResult> {
  throw new Error(
    "runArtifactsVerb: not implemented in v0.1.0. The artifacts verb shape is documented per ADR 0113; runtime delegation lands in a later release.",
  );
}
