import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";

import { registerPositionTools } from "./tools/position";
import { registerInventoryTools } from "./tools/inventory";
import { registerBlockTools } from "./tools/block";
import { registerFlightTools } from "./tools/flight";
import { registerEntityTools } from "./tools/entity";
import { registerChatTools } from "./tools/chat";
import { registerCommandTools } from "./tools/command";

export function createMcpServer(bot: any) {
  const server = new McpServer({
    name: "minecraft-bot",
    version: "1.0.0"
  });

  registerPositionTools(server, bot);
  registerInventoryTools(server, bot);
  registerBlockTools(server, bot);
  registerEntityTools(server, bot);
  registerFlightTools(server, bot);
  registerChatTools(server, bot);
  registerCommandTools(server);

  return server;
}

export function createMcpServerTransport() {
    const transport = new StdioServerTransport();
    return transport;
}
