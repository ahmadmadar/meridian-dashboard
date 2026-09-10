import "server-only";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export class McpToolError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

// One client connection per call, mirroring the server's own per-request
// McpServer instance (server.ts, buildServer()) — the server is stateless
// (sessionIdGenerator: undefined), so there's no persistent session to
// reuse across requests here either.
export async function callMcpTool<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const serverUrl = requireEnv("MCP_SERVER_URL");
  const apiKey = requireEnv("MCP_KEY_DASHBOARD");

  const transport = new StreamableHTTPClientTransport(new URL("/mcp", serverUrl), {
    requestInit: { headers: { "x-api-key": apiKey } },
  });
  const client = new Client({ name: "meridian-dashboard", version: "0.1.0" });

  try {
    await client.connect(transport);
    const result = await client.callTool({ name, arguments: args });

    const [firstContent] = (result.content as Array<{ type: string; text?: string }>) ?? [];
    if (!firstContent || firstContent.type !== "text" || !firstContent.text) {
      throw new McpToolError("INTERNAL_ERROR", `Tool ${name} returned no text content`);
    }

    const parsed = JSON.parse(firstContent.text);

    if (result.isError) {
      const { code, message } = parsed.error ?? { code: "INTERNAL_ERROR", message: "Unknown tool error" };
      throw new McpToolError(code, message);
    }

    return parsed as T;
  } finally {
    await client.close();
  }
}
