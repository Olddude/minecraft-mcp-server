import { z as zod } from 'zod';

import type { MinecraftMcpConfig, McpResponse, MinecraftMcpServer } from '@minecraft-mcp-server/types';
import { createMcpResponse, createMcpErrorResponse } from '@/src/server/models/mcp';
import { normalizeCommand } from '@/src/server/helpers/normalize-command';
import { minecraftCommand } from '@/src/server/helpers/minecraft-command';

/**
 * Registers the single command execution tool.
 * @param server - The MinecraftMcpServer instance to register the tool on.
 * @param config - The server configuration.
 */
export function registerMinecraftCommandTool(server: MinecraftMcpServer, config: MinecraftMcpConfig): void {
    server.tool(
        'minecraft-command',
        'Minecraft command execution',
        {
            command: zod.string().describe('The Minecraft command to execute'),
        },
        async ({ command }: { command: string }): Promise<McpResponse> => {
            try {
                const output = await minecraftCommand(command, config);
                const commandName = normalizeCommand(command);
                return createMcpResponse(`Executed command: "${commandName}"\nResult: ${output}`);
            } catch (error) {
                return createMcpErrorResponse(error as Error);
            }
        },
    );
}
