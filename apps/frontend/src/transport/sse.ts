import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { MinecraftMcpConfig } from '@minecraft-mcp-server/types';
import { logger } from 'libs/logging/src';

export interface SSEClientConfig {
    url: string;
    headers?: Record<string, string>;
}

export function createSSEClientTransport(config: SSEClientConfig): SSEClientTransport {
    logger.debug('Creating SSE client transport', { config });
    const transport = new SSEClientTransport(new URL(config.url));
    logger.info('SSE client transport created successfully', { url: config.url });
    return transport;
}

export function createSSEClientTransportFromConfig(config: MinecraftMcpConfig): SSEClientTransport {
    logger.debug('Creating SSE client transport from config', { config });
    const sseUrl = process.env.SSE_URL || 'http://localhost:3001/sse';
    const headers = {
        'Authorization': process.env.SSE_AUTH_TOKEN ? `Bearer ${process.env.SSE_AUTH_TOKEN}` : '',
        'User-Agent': `${config.name}/${config.version}`,
    };

    return createSSEClientTransport({
        url: sseUrl,
        headers,
    });
}
