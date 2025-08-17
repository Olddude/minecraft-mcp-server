import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { MinecraftClientTransport } from '@minecraft-mcp-server/types';
import { logger } from '@/src/frontend/logging';

export function createHttpClientTransport(serverUrl: string = 'http://localhost:3000/mcp'): MinecraftClientTransport {
    logger.debug(`Creating HTTP streaming client transport for ${serverUrl}`);

    const transport: MinecraftClientTransport = new StreamableHTTPClientTransport(
        new URL(serverUrl),
        {
            // Custom fetch implementation can be provided here if needed
            requestInit: {
                headers: {
                    'User-Agent': 'minecraft-mcp-client/1.0.0',
                },
            },
            reconnectionOptions: {
                maxReconnectionDelay: 30000, // 30 seconds
                initialReconnectionDelay: 1000, // 1 second
                reconnectionDelayGrowFactor: 1.5,
                maxRetries: 5,
            },
        },
    );

    logger.info('HTTP streaming client transport created successfully');
    return transport;
}
