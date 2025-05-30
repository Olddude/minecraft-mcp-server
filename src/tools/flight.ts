import { z as zod } from 'zod';
import mineflayer from 'mineflayer';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { McpResponse } from '@olddude/minecraft-server-java';
import { createErrorResponse, createResponse } from '../response';
import { Vec3 } from 'vec3';

function createCancellableFlightOperation(
    bot: mineflayer.Bot,
    destination: Vec3,
    controller: AbortController,
): Promise<boolean> {
    return new Promise((resolve, reject) => {
        let aborted = false;

        controller.signal.addEventListener('abort', () => {
            aborted = true;
            bot.creative.stopFlying();
            reject(new Error('Flight operation cancelled'));
        });

        bot.creative.flyTo(destination)
            .then(() => {
                if (!aborted) {
                    resolve(true);
                }
            })
            .catch((err: Error) => {
                if (!aborted) {
                    reject(err);
                }
            });
    });
}

export function registerFlightTools(server: McpServer, bot: mineflayer.Bot) {
    server.tool(
        'fly-to',
        'Make the bot fly to a specific position',
        {
            x: zod.number().describe('X coordinate'),
            y: zod.number().describe('Y coordinate'),
            z: zod.number().describe('Z coordinate'),
        },
        async ({ x, y, z }): Promise<McpResponse> => {
            if (!bot.creative) {
                return createResponse('Creative mode is not available. Cannot fly.');
            }

            const currentPos = bot.entity.position;
            console.error(
                `Flying from (${Math.floor(currentPos.x)}, ${Math.floor(currentPos.y)}, ${Math.floor(currentPos.z)}) ` +
                `to (${Math.floor(x)}, ${Math.floor(y)}, ${Math.floor(z)})`,
            );

            const controller = new AbortController();
            const FLIGHT_TIMEOUT_MS = 20000;

            const timeoutId = setTimeout(() => {
                if (!controller.signal.aborted) {
                    controller.abort();
                }
            }, FLIGHT_TIMEOUT_MS);

            try {
                const destination = new Vec3(x, y, z);
                await createCancellableFlightOperation(bot, destination, controller);
                return createResponse(`Successfully flew to position (${x}, ${y}, ${z}).`);
            } catch (error) {
                if (controller.signal.aborted) {
                    const currentPosAfterTimeout = bot.entity.position;
                    const flightTimeoutInMs = FLIGHT_TIMEOUT_MS/1000;
                    return createErrorResponse(
                        `Flight timed out after ${flightTimeoutInMs} seconds. The destination may be unreachable. ` +
                        `Current position: (${Math.floor(currentPosAfterTimeout.x)}, ` +
                        `${Math.floor(currentPosAfterTimeout.y)}, ` +
                        `${Math.floor(currentPosAfterTimeout.z)})`,
                    );
                }

                console.error('Flight error:', error);
                return createErrorResponse(error as Error);
            } finally {
                clearTimeout(timeoutId);
                bot.creative.stopFlying();
            }
        },
    );
}
