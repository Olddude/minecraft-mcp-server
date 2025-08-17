import { MinecraftMcpConfig } from '@minecraft-mcp-server/types';
import { normalizeCommand } from '@/src/backend/helpers/normalize-command';
import { execSync } from 'node:child_process';

/**
 * Helper function to execute a single Minecraft command via mcrcon.
 * @param command - The Minecraft command to execute
 * @param config - The server configuration containing mcrcon details
 * @returns Promise that resolves with the command output
 */
export function minecraftCommand(command: string, config: MinecraftMcpConfig): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const normalizedCommand = normalizeCommand(command);
            const mcrconParams = `-H ${config.mcrconHost} -P ${config.mcrconPort} -p ${config.mcrconPass}`;
            const mcrconCommand = `mcrcon ${mcrconParams} "${normalizedCommand}"`;

            const output = execSync(mcrconCommand, {
                stdio: 'pipe',
                encoding: 'utf-8',
                cwd: process.cwd(),
                env: process.env,
            });

            // Strip ANSI escape codes from the output
            // eslint-disable-next-line no-control-regex
            const cleanOutput = output.toString().replace(/\u001b\[[0-9;]*m/g, '').trim();
            resolve(cleanOutput);
        } catch (error) {
            reject(error);
        }
    });
}
