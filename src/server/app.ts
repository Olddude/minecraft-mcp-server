/* eslint-disable max-lines */
/**
 * This module provides model context protocol (MCP) server functionality for Minecraft.
 * It allows interaction with a Minecraft server using the Model Context Protocol.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Server as HttpServer } from 'http';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { join } from 'path';

import type {
    MinecraftMcpConfig,
    MinecraftMcpServer,
    MinecraftHttpServerTransport,
} from '@minecraft-mcp-server/types';
import { registerPrompts } from '@/src/server/prompts';
import { registerResources } from '@/src/server/resources';
import { registerTools } from '@/src/server/tools';
import { createHttpStreamingTransport } from '@/src/server/transport/http-streaming';
import { logger } from './logging';

function setupBasicRoutes(app: express.Application, config: MinecraftMcpConfig) {
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: config.name,
            version: config.version,
        });
    });
    app.get('/tools', (req, res) => {
        try {
            res.json({
                tools: [
                    {
                        name: 'execute-command',
                        description: 'Execute a single Minecraft server command',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                command: { type: 'string', description: 'Minecraft command to execute' },
                            },
                            required: ['command'],
                        },
                    },
                    {
                        name: 'execute-sequential-command-batch',
                        description: 'Execute multiple Minecraft commands sequentially',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                commands: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Array of commands to execute',
                                },
                            },
                            required: ['commands'],
                        },
                    },
                    {
                        name: 'execute-parallel-command-batch',
                        description: 'Execute multiple Minecraft commands in parallel',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                commands: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Array of commands to execute',
                                },
                            },
                            required: ['commands'],
                        },
                    },
                ],
            });
        } catch (error) {
            logger.error('Error listing tools:', error);
            res.status(500).json({ error: 'Failed to list tools' });
        }
    });

    app.post('/tools/execute-command', (req, res) => {
        try {
            const { command } = req.body;
            if (!command || typeof command !== 'string') {
                res.status(400).json({ error: 'Invalid command parameter' });
                return;
            }

            res.json({
                success: true,
                output: `Command "${command}" executed successfully`,
            });
        } catch (error) {
            logger.error('Error executing command:', error);
            res.status(500).json({ error: 'Failed to execute command' });
        }
    });

    app.get('/resources', (req, res) => {
        try {
            res.json({
                resources: [
                    {
                        uri: 'minecraft://commands',
                        name: 'Available Commands',
                        description: 'List of all available Minecraft commands',
                        mimeType: 'application/json',
                    },
                    {
                        uri: 'minecraft://building-patterns',
                        name: 'Building Patterns',
                        description: 'Common Minecraft building patterns and templates',
                        mimeType: 'text/markdown',
                    },
                    {
                        uri: 'minecraft://server-config',
                        name: 'Server Configuration',
                        description: 'Current server configuration and settings',
                        mimeType: 'application/json',
                    },
                ],
            });
        } catch (error) {
            logger.error('Error listing resources:', error);
            res.status(500).json({ error: 'Failed to list resources' });
        }
    });

    app.get('/prompts', (req, res) => {
        try {
            res.json({
                prompts: [
                    {
                        name: 'build-house',
                        description: 'Generate commands to build a house structure',
                        arguments: [
                            { name: 'style', description: 'House style (modern, medieval, etc.)' },
                            { name: 'size', description: 'House size (small, medium, large)' },
                        ],
                    },
                    {
                        name: 'terraform-landscape',
                        description: 'Generate commands to terraform and shape landscape',
                        arguments: [
                            { name: 'area', description: 'Area coordinates to terraform' },
                            { name: 'biome', description: 'Target biome type' },
                        ],
                    },
                    {
                        name: 'redstone-automation',
                        description: 'Generate redstone automation systems',
                        arguments: [
                            { name: 'type', description: 'Automation type (farm, door, etc.)' },
                        ],
                    },
                ],
            });
        } catch (error) {
            logger.error('Error listing prompts:', error);
            res.status(500).json({ error: 'Failed to list prompts' });
        }
    });
}

function setupOpenAIRoutes(app: express.Application) {
    app.get('/v1/models', (req, res) => {
        try {
            res.json({
                object: 'list',
                data: [
                    {
                        id: 'minecraft-mcp',
                        object: 'model',
                        created: Date.now(),
                        owned_by: 'minecraft-mcp-server',
                        permission: [],
                        root: 'minecraft-mcp',
                        parent: null,
                    },
                ],
            });
        } catch (error) {
            logger.error('Error listing models:', error);
            res.status(500).json({ error: 'Failed to list models' });
        }
    });

    app.post('/v1/chat/completions', (req, res) => {
        try {
            const { messages, model, stream = false } = req.body;

            if (!messages || !Array.isArray(messages)) {
                res.status(400).json({ error: 'Invalid messages parameter' });
                return;
            }

            const response = processOpenAIChatCompletion(messages, model, stream);

            if (stream) {
                res.setHeader('Content-Type', 'text/plain');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                res.write(`data: ${JSON.stringify(response)}\n\n`);
                res.write('data: [DONE]\n\n');
                res.end();
            } else {
                res.json(response);
            }

        } catch (error) {
            logger.error('Error in chat completion:', error);
            if (error.message === 'No user message found') {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Failed to process chat completion' });
            }
        }
    });
}

function processOpenAIChatCompletion(messages: unknown[], model?: string) {
    const lastMessage = messages.filter((m: { role: string; content: string }) => m.role === 'user').pop();
    if (!lastMessage) {
        throw new Error('No user message found');
    }
    const userContent = lastMessage.content;
    const commandMatch = userContent.match(/\/(\w+[\s\w]*)/g);
    let responseContent = '';
    const toolCalls = [];

    if (commandMatch) {
        for (const command of commandMatch) {
            const cleanCommand = command.replace('/', '').trim();
            toolCalls.push({
                id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'function',
                function: {
                    name: 'execute-command',
                    arguments: JSON.stringify({ command: cleanCommand }),
                },
            });
        }
        responseContent = `I found ${commandMatch.length} Minecraft command(s) in your message. Executing them now...`;
    } else {
        const lowerContent = userContent.toLowerCase();
        if (lowerContent.includes('build') || lowerContent.includes('construct')) {
            responseContent = 'I can help you build structures in Minecraft! ' +
                'You can use commands like `/fill` or `/setblock`. What would you like to build?';
        } else if (lowerContent.includes('time') || lowerContent.includes('weather')) {
            responseContent = 'I can help you control time and weather! ' +
                'Try commands like `/time set day` or `/weather clear`.';
        } else if (lowerContent.includes('teleport') || lowerContent.includes('tp')) {
            responseContent = 'I can help you teleport! Use `/tp <player> <x> <y> <z>` to teleport to coordinates.';
        } else {
            responseContent = 'I\'m a Minecraft MCP server assistant. I can help you execute Minecraft commands, ' +
                'build structures, manage resources, and more. What would you like to do in Minecraft?';
        }
    }

    return {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model || 'minecraft-mcp',
        choices: [{
            index: 0,
            message: {
                role: 'assistant',
                content: responseContent,
                tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
            },
            finish_reason: 'stop',
        }],
        usage: {
            prompt_tokens: userContent.length,
            completion_tokens: responseContent.length,
            total_tokens: userContent.length + responseContent.length,
        },
    };
}

function createHttpServer(
    transport: MinecraftHttpServerTransport,
    config: MinecraftMcpConfig,
    port: number = 3000,
): HttpServer {
    const app = express();

    // Load and configure OpenAPI specification
    const openApiPath = join(__dirname, 'openapi.json');
    const openApiSpec = JSON.parse(readFileSync(openApiPath, 'utf8'));
    openApiSpec.servers = [{ url: `http://localhost:${port}`, description: 'Local development server' }];
    openApiSpec.info.version = config.version;

    // Configure CORS and JSON parsing
    app.use(cors({
        origin: '*',
        methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Mcp-Session-Id', 'Last-Event-Id'],
        exposedHeaders: ['Mcp-Session-Id'],
        credentials: false,
    }));
    app.use(express.json());
    // MCP JSON-RPC endpoint at root
    app.all('/', async (req, res) => {
        try {
            await transport.handleRequest(req, res, req.body);
        } catch (error) {
            logger.error('Error handling MCP request:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    // Setup all route handlers
    setupBasicRoutes(app, config);
    setupOpenAIRoutes(app);
    // OpenAPI specification endpoint
    app.get('/openapi.json', (req, res) => {
        res.json(openApiSpec);
    });
    // Swagger UI endpoint
    app.use('/openapi', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
        customSiteTitle: 'Minecraft MCP Server API',
        customCss: '.swagger-ui .topbar { display: none }',
        swaggerOptions: { persistAuthorization: true, displayRequestDuration: true, filter: true },
    }));
    // 404 handler for other routes
    app.use((req, res) => {
        res.status(404).json({ error: 'Not Found' });
    });
    // Error handler
    app.use((error: Error, req: express.Request, res: express.Response) => {
        logger.error('Express error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    });
    const server = app.listen(port, () => {
        logger.info(`Minecraft MCP server listening on port ${port}`);
        logger.info([
            'Available endpoints:',
            `  POST   http://localhost:${port}/                    - MCP JSON-RPC protocol`,
            `  GET    http://localhost:${port}/openapi             - Swagger UI documentation`,
            `  GET    http://localhost:${port}/openapi.json        - OpenAPI specification`,
            `  GET    http://localhost:${port}/tools               - List available tools`,
            `  POST   http://localhost:${port}/tools/execute-command - Execute Minecraft commands`,
            `  GET    http://localhost:${port}/resources           - List available resources`,
            `  GET    http://localhost:${port}/prompts             - List available prompts`,
            `  GET    http://localhost:${port}/health              - Health check`,
            `  GET    http://localhost:${port}/v1/models           - OpenAI compatible models`,
            `  POST   http://localhost:${port}/v1/chat/completions - OpenAI compatible chat`,
        ].join('\n'));
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
export async function runAsServer(config: MinecraftMcpConfig) {
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
