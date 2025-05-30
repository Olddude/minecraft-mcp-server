import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z as zod } from 'zod';
import { goals } from 'mineflayer-pathfinder';
import mineflayer from 'mineflayer';
import type { Direction, McpResponse } from '@olddude/minecraft-server-java';
import { createErrorResponse, createResponse } from '../response';
import { Vec3 } from 'vec3';

export function registerPositionTools(server: McpServer, bot: mineflayer.Bot) {
    server.tool(
        'get-position',
        'Get the current position of the bot',
        {},
        async (): Promise<McpResponse> => {
            try {
                await Promise.resolve();
                const {position} = bot.entity;
                const pos = {
                    x: Math.floor(position.x),
                    y: Math.floor(position.y),
                    z: Math.floor(position.z),
                };

                return createResponse(`Current position: (${pos.x}, ${pos.y}, ${pos.z})`);
            } catch (error) {
                return createErrorResponse(error as Error);
            }
        },
    );

    server.tool(
        'move-to-position',
        'Move the bot to a specific position',
        {
            x: zod.number().describe('X coordinate'),
            y: zod.number().describe('Y coordinate'),
            z: zod.number().describe('Z coordinate'),
            range: zod.number().optional().describe('How close to get to the target (default: 1)'),
        },
        async ({ x, y, z, range = 1 }): Promise<McpResponse> => {
            try {
                const goal = new goals.GoalNear(x, y, z, range);
                await bot.pathfinder.goto(goal);

                return createResponse(`Successfully moved to position near (${x}, ${y}, ${z})`);
            } catch (error) {
                return createErrorResponse(error as Error);
            }
        },
    );

    server.tool(
        'look-at',
        'Make the bot look at a specific position',
        {
            x: zod.number().describe('X coordinate'),
            y: zod.number().describe('Y coordinate'),
            z: zod.number().describe('Z coordinate'),
        },
        async ({ x, y, z }): Promise<McpResponse> => {
            try {
                await bot.lookAt(new Vec3(x, y, z), true);

                return createResponse(`Looking at position (${x}, ${y}, ${z})`);
            } catch (error) {
                return createErrorResponse(error as Error);
            }
        },
    );

    server.tool(
        'jump',
        'Make the bot jump',
        {},
        async (): Promise<McpResponse> => {
            try {
                await Promise.resolve();
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 250);

                return createResponse('Successfully jumped');
            } catch (error) {
                return createErrorResponse(error as Error);
            }
        },
    );

    server.tool(
        'move-in-direction',
        'Move the bot in a specific direction for a duration',
        {
            direction: zod.enum(['forward', 'back', 'left', 'right']).describe('Direction to move'),
            duration: zod.number().optional().describe('Duration in milliseconds (default: 1000)'),
        },
        async ({ direction, duration = 1000 }: { direction: Direction, duration?: number }): Promise<McpResponse> => {
            await Promise.resolve();
            return new Promise((resolve) => {
                try {
                    bot.setControlState(direction, true);

                    setTimeout(() => {
                        bot.setControlState(direction, false);
                        resolve(createResponse(`Moved ${direction} for ${duration}ms`));
                    }, duration);
                } catch (error) {
                    bot.setControlState(direction, false);
                    resolve(createErrorResponse(error as Error));
                }
            });
        },
    );
}
