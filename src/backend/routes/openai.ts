import type { Router } from 'express';
import { Router as createRouter } from 'express';
import { logger } from '@/src/backend/logging';

interface ChatMessage {
    role: string;
    content: string;
}

function processOpenAIChatCompletion(messages: unknown[], model?: string) {
    const lastMessage = (messages as ChatMessage[]).filter((m) => m.role === 'user').pop();
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

export function createOpenAIRoutes(): Router {
    const router = createRouter();

    // Models endpoint
    router.get('/v1/models', (req, res) => {
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

    // Chat completions endpoint
    router.post('/v1/chat/completions', (req, res) => {
        try {
            const { messages, model, stream = false } = req.body;

            if (!messages || !Array.isArray(messages)) {
                res.status(400).json({ error: 'Invalid messages parameter' });
                return;
            }

            const response = processOpenAIChatCompletion(messages, model);

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
            if (error instanceof Error && error.message === 'No user message found') {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Failed to process chat completion' });
            }
        }
    });

    return router;
}
