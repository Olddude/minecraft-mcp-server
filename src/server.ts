import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import mineflayer from 'mineflayer';

import { registerPositionTools } from './tools/position';
import { registerInventoryTools } from './tools/inventory';
// import { registerBlockTools } from './tools/block';
import { registerFlightTools } from './tools/flight';
import { registerEntityTools } from './tools/entity';
import { registerChatTools } from './tools/chat';
import { registerCommandTools } from './tools/command';

export function createMcpServer(bot: mineflayer.Bot) {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    const server = new McpServer({
        name: packageJson.name,
        version: packageJson.version,
    });

    registerPositionTools(server, bot);
    registerInventoryTools(server, bot);
    // registerBlockTools(server, bot);
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
