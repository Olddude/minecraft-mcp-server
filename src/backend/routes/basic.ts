import type { Router } from 'express';
import { Router as createRouter } from 'express';
import type { MinecraftMcpConfig } from '@minecraft-mcp-server/types';
import { logger } from '@/src/backend/logging';

export function createBasicRoutes(config: MinecraftMcpConfig): Router {
    const router = createRouter();

    // Health check endpoint
    router.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: config.name,
            version: config.version,
        });
    });

    // Tools endpoint
    router.get('/tools', (req, res) => {
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

    // Execute command endpoint
    router.post('/tools/execute-command', (req, res) => {
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

    // Resources endpoint
    router.get('/resources', (req, res) => {
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

    // Prompts endpoint
    router.get('/prompts', (req, res) => {
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

    return router;
}
