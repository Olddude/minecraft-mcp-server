/**
 * This module provides model context protocol (MCP) server functionality for Minecraft.
 * It allows interaction with a Minecraft server using the Model Context Protocol.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Server as HttpServer } from 'http';

import type {
    MinecraftMcpConfig,
    MinecraftMcpServer,
    MinecraftHttpServerTransport,
} from '@minecraft-mcp-server/types';
import { registerPrompts } from '@/src/server/prompts';
import { registerResources } from '@/src/server/resources';
import { registerTools } from '@/src/server/tools';
import { createHttpServerTransport } from '@/src/server/transport/http';
import { createHttpServer } from '@/src/server/httpServer';

/**
 * Handles process termination signals to gracefully shut down the bot and server.
 * @param server The Minecraft MCP server instance.
 * @param transport The Minecraft MCP server transport instance.
 * @param httpServer The HTTP server instance.
 * @returns A callback function that handles the termination signal.
 */
export function createServerTerminationCallback(
    server: MinecraftMcpServer,
    transport: MinecraftHttpServerTransport,
    httpServer: HttpServer,
): (signal: NodeJS.Signals) => void {
    return () => {
        server.close();
        transport.close();
        httpServer.close();
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
    const transport = createHttpServerTransport();

    // Create HTTP server to handle requests
    const httpServer = createHttpServer(transport, config);

    const terminationCallback = createServerTerminationCallback(server, transport, httpServer);
    process.on('SIGTERM', terminationCallback);
    process.on('SIGINT', terminationCallback);

    await server.connect(transport);
}
