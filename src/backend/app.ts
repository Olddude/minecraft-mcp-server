/* eslint-disable no-case-declarations */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Server as HttpServer } from 'http';
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join } from 'path';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { randomUUID } from 'node:crypto';

import type {
    MinecraftMcpConfig,
    MinecraftMcpServer,
    MinecraftHttpServerTransport,
} from '@minecraft-mcp-server/types';
import { registerPrompts } from '@/src/backend/prompts';
import { registerResources } from '@/src/backend/resources';
import { registerTools } from '@/src/backend/tools';
import { logger } from '@/src/shared/logging';
import { createBasicRoutes } from '@/src/backend/routes/basic';
import { createOpenAIRoutes } from '@/src/backend/routes/openai';
import { createDocsRoutes } from '@/src/backend/routes/docs';

export interface HTTPStreamingConfig {
    enableJsonResponse?: boolean;
    enableDnsRebindingProtection?: boolean;
    corsOrigins?: string[];
}

/**
 * Creates and configures an Express application with middleware and routes.
 * @param config The Minecraft MCP configuration.
 * @param transport The HTTP transport for handling MCP requests.
 * @param port The port number for the server (used in OpenAPI spec).
 * @returns A configured Express application.
 */
export function createExpressApp(
    config: MinecraftMcpConfig,
    transport?: MinecraftHttpServerTransport,
    port: number = 3000,
): express.Application {
    const app = express();

    // Load and configure OpenAPI specification
    const openApiPath = join(__dirname, 'openapi.json');
    const openApiSpec = JSON.parse(readFileSync(openApiPath, 'utf8'));
    openApiSpec.info.version = config.version;
    openApiSpec.servers = [
        {
            url: `http://localhost:${port}`,
            description: 'Local development server',
        },
    ];

    // Configure CORS
    app.use(cors({
        origin: '*',
        methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Mcp-Session-Id', 'Last-Event-Id'],
        exposedHeaders: ['Mcp-Session-Id'],
        credentials: false,
    }));

    // Parse JSON body
    app.use(express.json());

    // Handle MCP requests if transport is provided
    if (transport) {
        app.all('/', async (req, res) => {
            try {
                await transport.handleRequest(req, res, req.body);
            } catch (error) {
                logger.error('Error handling MCP request:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
    }

    // Add routes
    app.use(createBasicRoutes(config));
    app.use(createOpenAIRoutes());
    app.use(createDocsRoutes(openApiSpec));

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({ error: 'Not Found' });
    });

    // Error handler
    app.use((error: Error, req: express.Request, res: express.Response) => {
        logger.error('Express error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    });

    return app;
}

function createHttpStreamingTransport(config?: HTTPStreamingConfig): MinecraftHttpServerTransport {
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

function createHttpServer(
    transport: MinecraftHttpServerTransport,
    config: MinecraftMcpConfig,
    port: number = 3000,
): HttpServer {
    const app = createExpressApp(config, transport, port);

    const server = app.listen(port, () => {
        logger.info(`Minecraft MCP server listening on port ${port}`);
    });

    server.on('error', (error) => {
        logger.error('Express server error:', error);
    });

    return server;
}

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
export async function runApplication(config: MinecraftMcpConfig) {
    const server = createMcpServer(config);
    registerPrompts(server);
    registerResources(server);
    registerTools(server, config);

    const transportType = process.env.MCP_TRANSPORT || 'http';

    switch (transportType) {
    case 'stdio':
        logger.info('Starting MCP server with stdio transport');
        const stdioTransport = new StdioServerTransport();
        process.on('SIGTERM', () => {
            server.close();
            process.exit(0);
        });
        process.on('SIGINT', () => {
            server.close();
            process.exit(0);
        });
        await server.connect(stdioTransport);
        break;

    case 'sse':
        logger.info('Starting MCP server with SSE transport');
        const ssePort = 3000;
        const sseApp = createExpressApp(config, undefined, ssePort);

        let sseTransport: SSEServerTransport;
        sseApp.get('/sse', (req, res) => {
            sseTransport = new SSEServerTransport('/sse', res);
            server.connect(sseTransport).catch(error => {
                logger.error('Failed to connect SSE transport:', error);
            });
        });

        const sseServer = sseApp.listen(ssePort, () => {
            logger.info(`MCP SSE server listening on port ${ssePort}`);
        });

        process.on('SIGTERM', () => {
            server.close();
            if (sseTransport) {sseTransport.close();}
            sseServer.close();
            process.exit(0);
        });
        process.on('SIGINT', () => {
            server.close();
            if (sseTransport) {sseTransport.close();}
            sseServer.close();
            process.exit(0);
        });
        break;

    case 'http':
    default:
        logger.info('Starting MCP server with HTTP transport (default)');
        const transport = createHttpStreamingTransport();
        const httpServer = createHttpServer(transport, config);
        const terminationCallback = createServerTerminationCallback(server, transport, httpServer);
        process.on('SIGTERM', terminationCallback);
        process.on('SIGINT', terminationCallback);
        await server.connect(transport);
        break;
    }
}
