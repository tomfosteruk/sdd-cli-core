import { describe, it, expect } from "vitest";
import {
  jsonContent,
  errorContent,
  dedupeSources,
  McpEnvelopeError,
  type McpErrorEnvelope,
  type CompositionResult,
} from "../src/mcp/index.js";

describe("mcp/envelope", () => {
  it("jsonContent wraps a payload in the MCP content-array shape", () => {
    const result = jsonContent({ hello: "world" });
    expect(result.content).toHaveLength(1);
    const first = result.content[0]!;
    expect(first.type).toBe("text");
    expect(JSON.parse(first.text)).toEqual({ hello: "world" });
  });

  it("errorContent flags isError true and serialises the envelope", () => {
    const envelope: McpErrorEnvelope = {
      code: "E_BAD",
      message: "bad",
      remediation: "fix it",
    };
    const result = errorContent(envelope);
    expect(result.isError).toBe(true);
    const first = result.content[0]!;
    expect(JSON.parse(first.text)).toMatchObject({ code: "E_BAD" });
  });

  it("dedupeSources removes duplicates preserving first-occurrence order", () => {
    expect(dedupeSources(["a", "b", "a", "c", "b"])).toEqual(["a", "b", "c"]);
  });
});

describe("mcp/types", () => {
  it("McpEnvelopeError carries the envelope on the instance", () => {
    const envelope: McpErrorEnvelope = {
      code: "E",
      message: "msg",
      remediation: "rem",
    };
    const err = new McpEnvelopeError(envelope);
    expect(err.message).toBe("msg");
    expect(err.envelope).toBe(envelope);
    expect(err).toBeInstanceOf(Error);
  });

  it("CompositionResult type compiles", () => {
    const sample: CompositionResult<{ x: number }> = {
      payload: { x: 1 },
      sources: ["sdd://x"],
      pin_to_commit: "abc",
    };
    expect(sample.payload.x).toBe(1);
  });
});
