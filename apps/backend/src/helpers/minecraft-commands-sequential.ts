import { MinecraftMcpConfig } from '@minecraft-mcp-server/types';
import { minecraftCommand } from '@/src/backend/helpers/minecraft-command';
import { normalizeCommand } from '@/src/backend/helpers/normalize-command';

/**
 * Helper function to execute multiple commands sequentially.
 * @param commands - Array of command strings to execute
 * @param config - The server configuration
 * @returns Promise that resolves with execution results
 */
export async function minecraftCommandsSequential(
    commands: string[],
    config: MinecraftMcpConfig,
): Promise<{ executed: Array<{ command: string; output: string }>; failed: string[] }> {
    const executed: Array<{ command: string; output: string }> = [];
    const failed: string[] = [];

    for (const command of commands) {
        try {
            const output = await minecraftCommand(command, config);
            executed.push({ command: normalizeCommand(command), output });
        } catch {
            failed.push(normalizeCommand(command));
        }
    }

    return { executed, failed };
}
