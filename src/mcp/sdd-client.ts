/**
 * Downstream sdd-mcp client — the ADR 0130 default composition pattern.
 *
 * Spawns `sdd-cli mcp serve` as a subprocess and keeps a persistent MCP
 * client connection for the session's lifetime. Adopter MCP servers use
 * this to consult SDD content without propagating credentials.
 *
 * Auth is intentionally not propagated — sdd-mcp is unauthenticated by
 * design (ADR 0128 §4.3). Any token the adopter server holds stays out
 * of the env passed to the subprocess beyond what sdd-mcp's own
 * workspace resolver needs (`SDD_REPO_PATH`).
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export interface SddClientOptions {
  /** Absolute path to the SDD repo to pin the server at. Optional — sdd-mcp's workspace resolver auto-discovers siblings. */
  readonly sddRepoPath?: string;
  /** Command to launch sdd-cli. Default: `sdd-cli`. Adopters override for local builds. */
  readonly sddCliCommand?: string;
  /** Clients identify themselves so logs are traceable. */
  readonly callerName: string;
  readonly callerVersion: string;
}

let cachedClient: Client | null = null;

export async function getSddClient(opts: SddClientOptions): Promise<Client> {
  if (cachedClient) return cachedClient;
  const command = opts.sddCliCommand ?? "sdd-cli";
  const env: Record<string, string> = {};
  // Pass through only PATH, HOME, and (if set) SDD_REPO_PATH — everything
  // else stays in the adopter process.
  for (const key of ["PATH", "HOME"]) {
    const v = process.env[key];
    if (v !== undefined) env[key] = v;
  }
  if (opts.sddRepoPath) {
    env["SDD_REPO_PATH"] = opts.sddRepoPath;
  } else if (process.env["SDD_REPO_PATH"]) {
    env["SDD_REPO_PATH"] = process.env["SDD_REPO_PATH"];
  }

  const transport = new StdioClientTransport({
    command,
    args: ["mcp", "serve"],
    env,
  });
  const client = new Client(
    { name: opts.callerName, version: opts.callerVersion },
    { capabilities: {} },
  );
  await client.connect(transport);
  cachedClient = client;
  return client;
}

export async function shutdownSddClient(): Promise<void> {
  if (cachedClient) {
    try {
      await cachedClient.close();
    } catch {
      /* best-effort */
    }
    cachedClient = null;
  }
}

/**
 * Extract `sources[]` and `pin_to_commit` from a tool-result body so
 * callers can cite them per ADR 0130 §4.3. Shape-tolerant — tolerates
 * absent fields.
 */
export interface ParsedSddToolResult {
  readonly body: Record<string, unknown>;
  readonly sources: readonly string[];
  readonly pin: string;
}

export function parseSddToolResult(content: unknown): ParsedSddToolResult {
  const arr = content as Array<{ text?: string }>;
  const first = arr?.[0];
  if (!first || typeof first.text !== "string") {
    return { body: {}, sources: [], pin: "HEAD" };
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(first.text) as Record<string, unknown>;
  } catch {
    return { body: {}, sources: [], pin: "HEAD" };
  }
  const sources = Array.isArray(parsed["sources"])
    ? (parsed["sources"] as unknown[]).filter(
        (s): s is string => typeof s === "string",
      )
    : [];
  const pin =
    typeof parsed["pin_to_commit"] === "string"
      ? (parsed["pin_to_commit"] as string)
      : "HEAD";
  return { body: parsed, sources, pin };
}
