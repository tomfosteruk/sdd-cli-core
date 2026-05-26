/**
 * Shared MCP types for adopter MCP servers. Mirrors the error-envelope
 * shape from the method's MCP-server conventions (ADR 0128 §4).
 */

export interface McpErrorEnvelope {
  readonly code: string;
  readonly message: string;
  readonly remediation: string;
  readonly context?: Record<string, unknown>;
  readonly links?: ReadonlyArray<{ title: string; url: string }>;
}

export class McpEnvelopeError extends Error {
  readonly envelope: McpErrorEnvelope;

  constructor(envelope: McpErrorEnvelope) {
    super(envelope.message);
    this.name = "McpEnvelopeError";
    this.envelope = envelope;
  }
}

/** Result shape every composition-enabled tool returns per ADR 0130 §4.3. */
export interface CompositionResult<T> {
  readonly payload: T;
  readonly sources: readonly string[];
  readonly pin_to_commit: string;
}
