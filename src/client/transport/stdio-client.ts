import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { MinecraftClientTransport } from '@minecraft-mcp-server/types';
import { logger } from '@/src/shared/logging';

export function createStdioClientTransport(): MinecraftClientTransport {
    logger.debug('Creating STDIO client transport');
    const transport: MinecraftClientTransport = new StdioClientTransport({
        command: 'node',
        args: [
            '-r',
            'dotenv/config',
            '-r',
            'ts-node/register',
            'index.ts',
        ],
        cwd: process.cwd(),
        env: process.env as Record<string, string>,
        stderr: process.stderr,
    });
    logger.info('STDIO client transport created successfully');
    return transport;
}
