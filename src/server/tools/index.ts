import type { MinecraftMcpConfig, MinecraftMcpServer } from '@minecraft-mcp-server/types';

import { registerMinecraftCommandTool } from '@/src/server/tools/minecraft-command-tool';
import { registerMinecraftSequentialBatchTool } from '@/src/server/tools/minecraft-sequential-batch-tool';
import { registerMinecraftParallelBatchTool } from '@/src/server/tools/minecraft-parallel-batch-tool';

/**
 * Registers all Minecraft command tools with the MCP server.
 * @param server - The MinecraftMcpServer instance to register tools on.
 * @param config - The server configuration containing mcrcon details.
 */
export function registerTools(server: MinecraftMcpServer, config: MinecraftMcpConfig): void {
    registerMinecraftCommandTool(server, config);
    registerMinecraftSequentialBatchTool(server, config);
    registerMinecraftParallelBatchTool(server, config);
}
