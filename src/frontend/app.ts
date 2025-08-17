import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { MinecraftMcpConfig, MinecraftMcpClient } from '@minecraft-mcp-server/types';
import { logger } from '@/src/shared/logging';
import { createHttpClientTransport } from '@/src/frontend/transport/http';

/**
 * Handles process termination signals to gracefully shut down the client.
 * @param client The Minecraft MCP client instance.
 * @returns A callback function that handles the termination signal.
 */
export function createClientTerminationCallback(
    client: MinecraftMcpClient,
): (signal: NodeJS.Signals) => void {
    return () => {
        client.close();
        process.exit(0);
    };
}

export function createMcpClient(config: MinecraftMcpConfig): MinecraftMcpClient {
    const client: MinecraftMcpClient = new Client({
        name: config.name,
        version: config.version,
    });
    return client;
}

/**
 * Runs the application as Minecraft MCP client based on the provided configuration.
 * @param config The application configuration.
 */
export async function runApplication(config: MinecraftMcpConfig) {
    const client: MinecraftMcpClient = createMcpClient(config);
    const transport = createHttpClientTransport();

    logger.info('Connecting to MCP server via HTTP streaming...');
    await client.connect(transport, {
        maxTotalTimeout: 10000, // 10 seconds,
        onprogress: (progress) => {
            logger.info('Client progress:', progress);
        },
        onresumptiontoken(token) {
            logger.info('Client resumption token:', token);
        },
        timeout: 5000, // 5 seconds
    });

    logger.info('Connected to MCP server successfully');

    // Execute a test command
    const response = await client.callTool({
        name: 'execute-command',
        arguments: {
            command: 'time set day',
        },
    });
    logger.info('Tool call response:', response);

    const terminationCallback = createClientTerminationCallback(client);
    process.on('SIGTERM', terminationCallback);
    process.on('SIGINT', terminationCallback);

    logger.info('Client started and connected via HTTP streaming');

    // Keep the client running
    setInterval(() => {
        logger.debug('Client heartbeat - still connected');
    }, 30000); // Log every 30 seconds
}
