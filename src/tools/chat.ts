import { z as zod } from 'zod';
import mineflayer from 'mineflayer';
import type { McpResponse } from '@olddude/minecraft-server-java';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { createErrorResponse, createResponse } from '../response';

export function registerChatTools(server: McpServer, bot: mineflayer.Bot) {
    server.tool(
        'send-chat',
        'Send a chat message in-game',
        {
            message: zod.string().describe('Message to send in chat'),
        },
        async ({ message }: { message: string }): Promise<McpResponse> => {
            try {
                await Promise.resolve();
                bot.chat(message);
                return createResponse(`Sent message: "${message}"`);
            } catch (error) {
                return createErrorResponse(error as Error);
            }
        },
    );
}
