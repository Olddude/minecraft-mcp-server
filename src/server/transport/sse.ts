import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type { MinecraftMcpConfig } from '@minecraft-mcp-server/types';
import { logger } from '../logging';

export interface SSEServerConfig {
    host?: string;
    port?: number;
    path?: string;
}

export function createSSEServerTransport(config?: SSEServerConfig): SSEServerTransport {
    const sseConfig = {
        host: config?.host || 'localhost',
        port: config?.port || 3001,
        path: config?.path || '/sse',
    };

    logger.debug('Creating SSE server transport', { config: sseConfig });
    const transport = new SSEServerTransport(sseConfig);
    logger.info('SSE server transport created successfully', { config: sseConfig });
    return transport;
}

export function createSSEServerTransportFromConfig(config: MinecraftMcpConfig): SSEServerTransport {
    logger.debug('Creating SSE server transport from config', { config });
    const sseConfig = {
        host: process.env.SSE_HOST || 'localhost',
        port: parseInt(process.env.SSE_PORT || '3001'),
        path: process.env.SSE_PATH || '/sse',
    };

    return createSSEServerTransport(sseConfig);
}
