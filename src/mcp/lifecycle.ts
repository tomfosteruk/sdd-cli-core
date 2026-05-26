/**
 * Lifecycle helpers for adopter MCP servers — stdio transport setup,
 * signal teardown, and downstream-client shutdown.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { shutdownSddClient } from "./sdd-client.js";

export interface RunMcpServerOptions {
  readonly server: McpServer;
  /**
   * Skip stdio connection and return immediately (for integration tests
   * that drive the server via in-memory transport).
   */
  readonly testMode?: boolean;
}

export async function runMcpServer(opts: RunMcpServerOptions): Promise<void> {
  if (opts.testMode) return;

  const transport = new StdioServerTransport();
  await opts.server.connect(transport);

  await new Promise<void>((resolve) => {
    transport.onclose = () => {
      resolve();
    };
    const onSignal = (): void => {
      void opts.server.close().finally(() => resolve());
    };
    process.once("SIGTERM", onSignal);
    process.once("SIGINT", onSignal);
  });

  await shutdownSddClient();
}
