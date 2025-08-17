/* eslint-disable max-lines */
import type { MinecraftMcpConfig } from '@minecraft-mcp-server/types';

/**
 * Generates a comprehensive OpenAPI 3.0 specification for the Minecraft MCP server
 */
export function generateOpenApiSpec(config: MinecraftMcpConfig) {
    return {
        openapi: '3.0.3',
        info: {
            title: 'Minecraft MCP Server API',
            description: 'Model Context Protocol (MCP) server for Minecraft command execution and resource management',
            version: config.version,
            license: {
                name: 'Apache 2.0',
                url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
            },
            contact: {
                name: 'Minecraft MCP Server',
                url: 'https://github.com/olddude/minecraft-mcp-server',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local development server',
            },
        ],
        paths: {
            '/mcp': {
                post: {
                    summary: 'Execute MCP JSON-RPC requests',
                    description: 'Main endpoint for Model Context Protocol communication',
                    tags: ['MCP'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/MCPRequest',
                                },
                                examples: {
                                    'initialize': {
                                        summary: 'Initialize MCP session',
                                        value: {
                                            jsonrpc: '2.0',
                                            id: 1,
                                            method: 'initialize',
                                            params: {
                                                protocolVersion: '2024-11-05',
                                                capabilities: {},
                                                clientInfo: {
                                                    name: 'minecraft-mcp-client',
                                                    version: '1.0.0',
                                                },
                                            },
                                        },
                                    },
                                    'list-tools': {
                                        summary: 'List available tools',
                                        value: {
                                            jsonrpc: '2.0',
                                            id: 2,
                                            method: 'tools/list',
                                        },
                                    },
                                    'call-tool': {
                                        summary: 'Execute a tool',
                                        value: {
                                            jsonrpc: '2.0',
                                            id: 3,
                                            method: 'tools/call',
                                            params: {
                                                name: 'execute-command',
                                                arguments: {
                                                    command: 'time set day',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        '200': {
                            description: 'MCP response',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/MCPResponse',
                                    },
                                },
                            },
                        },
                        '400': {
                            description: 'Bad request',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/ErrorResponse',
                                    },
                                },
                            },
                        },
                    },
                },
                get: {
                    summary: 'Establish SSE connection for MCP streaming',
                    description: 'Server-Sent Events endpoint for real-time MCP communication',
                    tags: ['MCP'],
                    parameters: [
                        {
                            name: 'Mcp-Session-Id',
                            in: 'header',
                            description: 'MCP session identifier',
                            schema: {
                                type: 'string',
                            },
                        },
                        {
                            name: 'Last-Event-Id',
                            in: 'header',
                            description: 'Last received event ID for resumption',
                            schema: {
                                type: 'string',
                            },
                        },
                    ],
                    responses: {
                        '200': {
                            description: 'SSE stream established',
                            content: {
                                'text/event-stream': {
                                    schema: {
                                        type: 'string',
                                        description: 'Server-Sent Events stream',
                                    },
                                },
                            },
                        },
                    },
                },
                delete: {
                    summary: 'Terminate MCP session',
                    description: 'Cleanly terminate an active MCP session',
                    tags: ['MCP'],
                    parameters: [
                        {
                            name: 'Mcp-Session-Id',
                            in: 'header',
                            required: true,
                            description: 'MCP session identifier to terminate',
                            schema: {
                                type: 'string',
                            },
                        },
                    ],
                    responses: {
                        '200': {
                            description: 'Session terminated successfully',
                        },
                        '404': {
                            description: 'Session not found',
                        },
                    },
                },
            },
            '/health': {
                get: {
                    summary: 'Health check endpoint',
                    description: 'Returns the current health status of the MCP server',
                    tags: ['Health'],
                    responses: {
                        '200': {
                            description: 'Server health information',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/HealthResponse',
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/openapi.json': {
                get: {
                    summary: 'OpenAPI specification',
                    description: 'Returns the OpenAPI 3.0 specification for this API',
                    tags: ['Documentation'],
                    responses: {
                        '200': {
                            description: 'OpenAPI specification',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        description: 'OpenAPI 3.0 specification',
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        components: {
            schemas: {
                MCPRequest: {
                    type: 'object',
                    required: ['jsonrpc', 'method'],
                    properties: {
                        jsonrpc: {
                            type: 'string',
                            enum: ['2.0'],
                            description: 'JSON-RPC version',
                        },
                        id: {
                            oneOf: [
                                { type: 'string' },
                                { type: 'number' },
                            ],
                            description: 'Request identifier',
                        },
                        method: {
                            type: 'string',
                            description: 'MCP method name',
                            enum: [
                                'initialize',
                                'tools/list',
                                'tools/call',
                                'resources/list',
                                'resources/read',
                                'prompts/list',
                                'prompts/get',
                            ],
                        },
                        params: {
                            type: 'object',
                            description: 'Method parameters',
                        },
                    },
                },
                MCPResponse: {
                    type: 'object',
                    required: ['jsonrpc'],
                    properties: {
                        jsonrpc: {
                            type: 'string',
                            enum: ['2.0'],
                        },
                        id: {
                            oneOf: [
                                { type: 'string' },
                                { type: 'number' },
                            ],
                        },
                        result: {
                            type: 'object',
                            description: 'Response result',
                        },
                        error: {
                            $ref: '#/components/schemas/MCPError',
                        },
                    },
                },
                MCPError: {
                    type: 'object',
                    required: ['code', 'message'],
                    properties: {
                        code: {
                            type: 'integer',
                            description: 'Error code',
                        },
                        message: {
                            type: 'string',
                            description: 'Error message',
                        },
                        data: {
                            type: 'object',
                            description: 'Additional error data',
                        },
                    },
                },
                HealthResponse: {
                    type: 'object',
                    required: ['status', 'timestamp', 'service', 'version'],
                    properties: {
                        status: {
                            type: 'string',
                            enum: ['ok', 'degraded', 'error'],
                            description: 'Service health status',
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Timestamp of health check',
                        },
                        service: {
                            type: 'string',
                            description: 'Service name',
                        },
                        version: {
                            type: 'string',
                            description: 'Service version',
                        },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    required: ['error'],
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error message',
                        },
                    },
                },
                MinecraftTool: {
                    type: 'object',
                    required: ['name', 'description'],
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Tool name',
                            enum: [
                                'execute-command',
                                'execute-sequential-command-batch',
                                'execute-parallel-command-batch',
                            ],
                        },
                        description: {
                            type: 'string',
                            description: 'Tool description',
                        },
                        inputSchema: {
                            type: 'object',
                            description: 'Input schema for the tool',
                        },
                    },
                },
                MinecraftResource: {
                    type: 'object',
                    required: ['uri', 'name'],
                    properties: {
                        uri: {
                            type: 'string',
                            description: 'Resource URI',
                            examples: [
                                'minecraft://commands',
                                'minecraft://building-patterns',
                                'minecraft://server-config',
                                'minecraft://block-reference',
                                'minecraft://resource-templates',
                            ],
                        },
                        name: {
                            type: 'string',
                            description: 'Resource name',
                        },
                        description: {
                            type: 'string',
                            description: 'Resource description',
                        },
                        mimeType: {
                            type: 'string',
                            description: 'Content MIME type',
                            examples: ['text/markdown', 'application/json'],
                        },
                    },
                },
                MinecraftPrompt: {
                    type: 'object',
                    required: ['name', 'description'],
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Prompt name',
                            enum: [
                                'build-house',
                                'terraform-landscape',
                                'redstone-automation',
                                'command-optimization',
                                'debug-issues',
                                'creative-projects',
                            ],
                        },
                        description: {
                            type: 'string',
                            description: 'Prompt description',
                        },
                        arguments: {
                            type: 'array',
                            description: 'Prompt arguments',
                            items: {
                                type: 'object',
                            },
                        },
                    },
                },
            },
            securitySchemes: {
                sessionId: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'Mcp-Session-Id',
                    description: 'MCP session identifier for stateful connections',
                },
            },
        },
        tags: [
            {
                name: 'MCP',
                description: 'Model Context Protocol endpoints for Minecraft server interaction',
            },
            {
                name: 'Health',
                description: 'Service health monitoring',
            },
            {
                name: 'Documentation',
                description: 'API documentation endpoints',
            },
        ],
        externalDocs: {
            description: 'Model Context Protocol Specification',
            url: 'https://modelcontextprotocol.io/docs/specification',
        },
    };
}
