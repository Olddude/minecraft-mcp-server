import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';
import type { MinecraftHttpServerTransport } from '@minecraft-mcp-server/types';
import { logger } from '../logging';

export function createHttpServerTransport(): MinecraftHttpServerTransport {
    logger.debug('Creating HTTP streaming server transport');
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId: string) => {
            logger.info(`HTTP session initialized: ${sessionId}`);
        },
        onsessionclosed: (sessionId: string) => {
            logger.info(`HTTP session closed: ${sessionId}`);
        },
        enableJsonResponse: false, // Use SSE streaming
        enableDnsRebindingProtection: false, // Disable for local development
    });
    logger.info('HTTP streaming server transport created successfully');
    return transport as MinecraftHttpServerTransport;
}
