/**
 * Response helpers for adopter MCP servers — keeps tool / resource
 * response construction uniform across every adopter's MCP server.
 */

import type { McpErrorEnvelope } from "./types.js";

/** JSON body wrapped in the MCP content-array shape. */
export function jsonContent<T>(payload: T): {
  content: Array<{ type: "text"; text: string }>;
} {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
  };
}

/** Error envelope wrapped in the MCP isError shape. */
export function errorContent(envelope: McpErrorEnvelope): {
  isError: true;
  content: Array<{ type: "text"; text: string }>;
} {
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }],
  };
}

/** Deduplicate a source-URI array preserving first-occurrence order. */
export function dedupeSources(sources: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of sources) {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}
