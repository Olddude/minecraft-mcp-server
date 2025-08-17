import { MinecraftMcpConfig } from '@minecraft-mcp-server/types';
import { minecraftCommand } from '@/src/server/helpers/minecraft-command';
import { normalizeCommand } from '@/src/server/helpers/normalize-command';

/**
 * Helper function to execute multiple commands in parallel.
 * @param commands - Array of command strings to execute
 * @param config - The server configuration
 * @returns Promise that resolves with execution results
 */
export async function minecraftCommandsParallel(
    commands: string[],
    config: MinecraftMcpConfig,
): Promise<{ executed: Array<{ command: string; output: string }>; failed: string[] }> {
    const results = await Promise.allSettled(
        commands.map(command => minecraftCommand(command, config)),
    );

    const executed: Array<{ command: string; output: string }> = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
        const normalizedCommand = normalizeCommand(commands[index]);
        if (result.status === 'fulfilled') {
            executed.push({ command: normalizedCommand, output: result.value });
        } else {
            failed.push(normalizedCommand);
        }
    });

    return { executed, failed };
}
