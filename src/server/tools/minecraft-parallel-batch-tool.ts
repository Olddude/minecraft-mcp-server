import { z as zod } from 'zod';

import type { MinecraftMcpConfig, McpResponse, MinecraftMcpServer } from '@minecraft-mcp-server/types';
import { createMcpResponse, createMcpErrorResponse } from '../models/mcp';
import { minecraftCommandsParallel } from '../helpers/minecraft-commands-parallel';

/**
 * Registers the parallel batch command execution tool.
 * @param server - The MinecraftMcpServer instance to register the tool on.
 * @param config - The server configuration.
 */
export function registerMinecraftParallelBatchTool(server: MinecraftMcpServer, config: MinecraftMcpConfig): void {
    server.tool(
        'minecraft-parallel-command-batch',
        'Minecraft commands executed in parallel',
        {
            commands: zod.array(zod.string()).describe('Array of Minecraft commands to execute in parallel'),
        },
        async ({ commands }: { commands: string[] }): Promise<McpResponse> => {
            try {
                if (commands.length === 0) {
                    return createMcpResponse('No commands provided');
                }

                const { executed, failed } = await minecraftCommandsParallel(commands, config);

                let message = 'Parallel batch execution completed.\n';
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
