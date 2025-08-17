import { z as zod } from 'zod';

import type { MinecraftMcpConfig, McpResponse, MinecraftMcpServer } from '@minecraft-mcp-server/types';
import { createMcpResponse, createMcpErrorResponse } from '@/src/server/models/mcp';
import { minecraftCommandsSequential } from '@/src/server/helpers/minecraft-commands-sequential';

/**
 * Registers the sequential batch command execution tool.
 * @param server - The MinecraftMcpServer instance to register the tool on.
 * @param config - The server configuration.
 */
export function registerMinecraftSequentialBatchTool(server: MinecraftMcpServer, config: MinecraftMcpConfig): void {
    server.tool(
        'minecraft-sequential-command-batch',
        'Minecraft commands executed sequentially',
        {
            commands: zod.array(zod.string()).describe('Array of Minecraft commands to execute in sequence'),
        },
        async ({ commands }: { commands: string[] }): Promise<McpResponse> => {
            try {
                if (commands.length === 0) {
                    return createMcpResponse('No commands provided');
                }

                const { executed, failed } = await minecraftCommandsSequential(commands, config);

                let message = 'Sequential batch execution completed.\n';
                message += `Successfully executed ${executed.length} commands:\n`;
                executed.forEach(({ command, output }) => {
                    message += `  - ${command}: ${output}\n`;
                });

                if (failed.length > 0) {
                    message += `\nFailed to execute ${failed.length} commands: [${failed.join(', ')}]`;
                }

                return createMcpResponse(message);
            } catch (error) {
                return createMcpErrorResponse(error as Error);
            }
        },
    );
}
