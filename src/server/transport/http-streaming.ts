import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';
import type { MinecraftHttpServerTransport } from '@minecraft-mcp-server/types';
import { logger } from '../logging';

export interface HTTPStreamingConfig {
    enableJsonResponse?: boolean;
    enableDnsRebindingProtection?: boolean;
    corsOrigins?: string[];
}

export function createHttpStreamingTransport(config?: HTTPStreamingConfig): MinecraftHttpServerTransport {
    logger.debug('Creating HTTP streaming server transport', { config });

    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId: string) => {
            logger.info(`HTTP streaming session initialized: ${sessionId}`);
        },
        onsessionclosed: (sessionId: string) => {
            logger.info(`HTTP streaming session closed: ${sessionId}`);
        },
        enableJsonResponse: config?.enableJsonResponse ?? false,
        enableDnsRebindingProtection: config?.enableDnsRebindingProtection ?? false,
    });

    logger.info('HTTP streaming server transport created successfully');
    return transport as MinecraftHttpServerTransport;
}
