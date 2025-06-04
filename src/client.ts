import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { MinecraftMcpConfig, MinecraftMcpClient, MinecraftClientTransport } from '@minecraft-mcp-server/types';


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

export function createMcpClientTransport(): MinecraftClientTransport {
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
    return transport;
}


/**
 * Runs the application as Minecraft MCP client based on the provided configuration.
 * @param config The application configuration.
 */
export async function runAsClient(config: MinecraftMcpConfig) {
    await Promise.resolve(); // Placeholder for any async initialization if needed
    const client: MinecraftMcpClient = createMcpClient(config);
    const transport = createMcpClientTransport();
    await client.connect(transport, {
        maxTotalTimeout: 10000, // 10 seconds,
        onprogress: (progress) => {
            console.info('Client progress:', progress);
        },
        onresumptiontoken(token) {
            console.info('Client resumption token:', token);
        },
        timeout: 5000, // 5 seconds
    });
    const response = await client.callTool({
        name: 'execute-command',
        version: '1.0.0',
        _meta: {
            mimeType: 'application/json',
            progressToken: '0',
        },
        arguments: {
            command: '/time set day',
        },
    });
    console.info('Tool call response:', response);
    const terminationCallback = createClientTerminationCallback(client);
    process.on('SIGTERM', terminationCallback);
    console.info('Client started. Waiting for server connection...', client);
    return;
}
