import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Server as HttpServer } from 'http';
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join } from 'path';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';

import type {
    MinecraftMcpConfig,
    MinecraftMcpServer,
    MinecraftHttpServerTransport,
} from '@minecraft-mcp-server/types';
import { registerPrompts } from '@/src/server/prompts';
import { registerResources } from '@/src/server/resources';
import { registerTools } from '@/src/server/tools';
import { logger } from '@/src/server/logging';
import { createBasicRoutes } from '@/src/server/routes/basic';
import { createOpenAIRoutes } from '@/src/server/routes/openai';
import { createDocsRoutes } from '@/src/server/routes/docs';

export interface HTTPStreamingConfig {
    enableJsonResponse?: boolean;
    enableDnsRebindingProtection?: boolean;
    corsOrigins?: string[];
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
    const app = express();

    const openApiPath = join(__dirname, 'openapi.json');
    const openApiSpec = JSON.parse(readFileSync(openApiPath, 'utf8'));
    openApiSpec.info.version = config.version;
    openApiSpec.servers = [
        {
            url: `http://localhost:${port}`,
            description: 'Local development server',
        },
    ];

    app.use(cors({
        origin: '*',
        methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Mcp-Session-Id', 'Last-Event-Id'],
        exposedHeaders: ['Mcp-Session-Id'],
        credentials: false,
    }));

    app.use(express.json());

    app.all('/', async (req, res) => {
        try {
            await transport.handleRequest(req, res, req.body);
        } catch (error) {
            logger.error('Error handling MCP request:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.use(createBasicRoutes(config));
    app.use(createOpenAIRoutes());
    app.use(createDocsRoutes(openApiSpec));

    app.use((req, res) => {
        res.status(404).json({ error: 'Not Found' });
    });

    app.use((error: Error, req: express.Request, res: express.Response) => {
        logger.error('Express error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    });

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
    const transport = createHttpStreamingTransport();

    // Create HTTP server to handle requests
    const httpServer = createHttpServer(transport, config);

    const terminationCallback = createServerTerminationCallback(server, transport, httpServer);
    process.on('SIGTERM', terminationCallback);
    process.on('SIGINT', terminationCallback);

    await server.connect(transport);
}
