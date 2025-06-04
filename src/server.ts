/**
 * This module provides model context protocol (MCP) server functionality for Minecraft.
 * It allows interaction with a Minecraft server using the Model Context Protocol.
 */

import type { JSONRPCRequest, JSONRPCResponse } from '@modelcontextprotocol/sdk/types';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import type {
    MinecraftMcpConfig,
    MinecraftMcpServer,
    MinecraftStdioServerTransport,
} from '@minecraft-mcp-server/types';
import { registerPrompts } from './prompts';
import { registerResources } from './resources';
import { handleTemplatesListRequest } from './resources/templates/protocol';
import { registerTools } from './tools';

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
 * Creates a new Minecraft Model Context Protocol (MCP) server transport using standard input/output.
 * This transport is used to communicate with the MCP server via the command line.
 * @returns A new instance of MinecraftStdioServerTransport.
 */
export function createMcpServerTransport(): MinecraftStdioServerTransport {
    const transport = new StdioServerTransport();
    return transport as MinecraftStdioServerTransport;
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
    const transport = createMcpServerTransport();

    // Patch: Intercept raw JSON-RPC for template listing
    // eslint-disable-next-line no-underscore-dangle
    const originalStdioTransportOnDataCallback = transport._ondata?.bind(transport);
    if (originalStdioTransportOnDataCallback) {
        // eslint-disable-next-line no-underscore-dangle
        transport._ondata = (chunk: Buffer) => {
            let jsonRpcRequest: JSONRPCRequest | undefined;
            try {
                jsonRpcRequest = JSON.parse(chunk.toString()) as JSONRPCRequest;
            } catch (error) {
                const parseErrorResponse: JSONRPCResponse = {
                    id: jsonRpcRequest?.id ?? 0,
                    jsonrpc: '2.0',
                    result: {
                        _meta: {
                            mimeType: 'application/json',
                        },
                        error: {
                            code: -32700, // Parse error
                            message: error instanceof Error ? error.message : 'Parse error',
                        },
                    },
                };
                transport.send(parseErrorResponse);
                return;
            }
            if (jsonRpcRequest.method === 'resources/templates/list') {
                const templatesResponse = handleTemplatesListRequest(jsonRpcRequest);
                transport.send(templatesResponse);
                return;
            }
            originalStdioTransportOnDataCallback(chunk);
        };
    }

    const terminationCallback = createServerTerminationCallback(server, transport);
    process.on('SIGTERM', terminationCallback);
    await server.connect(transport);
}
