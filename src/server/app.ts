/**
 * This module provides model context protocol (MCP) server functionality for Minecraft.
 * It allows interaction with a Minecraft server using the Model Context Protocol.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type {
    MinecraftMcpConfig,
    MinecraftMcpServer,
    MinecraftStdioServerTransport,
} from '@minecraft-mcp-server/types';
import { registerPrompts } from './prompts';
import { registerResources } from './resources';
import { registerTools } from './tools';
import { createStdioServerTransport, patchStdioTransportForTemplates } from '@/src/shared/transport/server';

/**
 * Handles process termination signals to gracefully shut down the bot and server.
 * @param server The Minecraft MCP server instance.
 * @param transport The Minecraft MCP server transport instance.
 * @returns A callback function that handles the termination signal.
 */
export function createServerTerminationCallback(
    server: MinecraftMcpServer,
    transport: MinecraftStdioServerTransport,
): (signal: NodeJS.Signals) => void {
    return () => {
        server.close();
        transport.close();
        process.exit(0);
    };
}

/**
 * Creates a new Minecraft Model Context Protocol (MCP) server instance.
 * This server is used to interact with a Minecraft bot using the Model Context Protocol.
 * @returns A new instance of MinecraftMcpServer.
 */
export function createMcpServer(config: MinecraftMcpConfig): MinecraftMcpServer {
    const server = new McpServer({
        name: config.name,
        version: config.version,
    });
    return server as MinecraftMcpServer;
}



/**
 * Runs the application as Minecraft MCP server based on the provided configuration.
 * @param config The application configuration.
 */
export async function runAsServer(config: MinecraftMcpConfig) {
    const server = createMcpServer(config);
    registerPrompts(server);
    registerResources(server);
    registerTools(server, config);
    const transport = createStdioServerTransport();

    patchStdioTransportForTemplates(transport);

    const terminationCallback = createServerTerminationCallback(server, transport);
    process.on('SIGTERM', terminationCallback);
    await server.connect(transport);
}
