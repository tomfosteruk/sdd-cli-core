import { describe, it, expect } from "vitest";
import {
  runContractsVerb,
  runArtifactsVerb,
  type ContractsVerbOptions,
  type ArtifactsVerbOptions,
} from "../src/pins/index.js";

describe("pins/contracts", () => {
  it("runContractsVerb throws an unimplemented error referencing ADR 0110", async () => {
    const opts: ContractsVerbOptions = { subcommand: "list" };
    await expect(runContractsVerb(opts)).rejects.toThrow(/ADR 0110/);
  });
});

describe("pins/artifacts", () => {
  it("runArtifactsVerb throws an unimplemented error referencing ADR 0113", async () => {
    const opts: ArtifactsVerbOptions = { subcommand: "check" };
    await expect(runArtifactsVerb(opts)).rejects.toThrow(/ADR 0113/);
  });
});
