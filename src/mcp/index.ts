/**
 * MCP envelope, lifecycle, and sdd-mcp composition client per ADR 0130.
 *
 * Scope: this module ships the generic envelope shape, the stdio
 * transport lifecycle, and the downstream sdd-mcp client. Each adopter's
 * own `src/mcp/` defines its server-specific resources, tools, and auth.
 */

export type { McpErrorEnvelope, CompositionResult } from "./types.js";
export { McpEnvelopeError } from "./types.js";
export { jsonContent, errorContent, dedupeSources } from "./envelope.js";
export {
  getSddClient,
  shutdownSddClient,
  parseSddToolResult,
} from "./sdd-client.js";
export type {
  SddClientOptions,
  ParsedSddToolResult,
} from "./sdd-client.js";
export { runMcpServer } from "./lifecycle.js";
export type { RunMcpServerOptions } from "./lifecycle.js";
