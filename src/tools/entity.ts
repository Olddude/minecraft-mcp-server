import { z as zod } from 'zod';
import mineflayer from 'mineflayer';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { McpResponse } from '@olddude/minecraft-server-java';
import { createErrorResponse, createResponse } from '../response';
import { Entity } from 'prismarine-entity';

export function registerEntityTools(server: McpServer, bot: mineflayer.Bot) {
    server.tool(
        'find-entity',
        'Find the nearest entity of a specific type',
        {
            type: zod.string().optional().describe('Type of entity to find (empty for any entity)'),
            maxDistance: zod.number().optional().describe('Maximum search distance (default: 16)'),
        },
        async ({ type = '', maxDistance = 16 }): Promise<McpResponse> => {
            try {
                await Promise.resolve();
                const entityFilter = (e: Entity) => {
                    const name = (e.displayName ?? e.username ?? e.name ?? '').toLowerCase();
                    return name.includes(type.toLowerCase());
                };

                const entity = bot.nearestEntity(entityFilter);

                if (!entity || bot.entity.position.distanceTo(entity.position) > maxDistance) {
                    return createResponse(`No ${type || 'entity'} found within ${maxDistance} blocks`);
                }

                const entityName = entity.name ||
                    (entity as Entity & { username?: string }).username ||
                    entity.type;
                const x = Math.floor(entity.position.x);
                const y = Math.floor(entity.position.y);
                const z = Math.floor(entity.position.z);
                return createResponse(`Found ${entityName} at position (${x}, ${y}, ${z})`);
            } catch (error) {
                return createErrorResponse(error as Error);
            }
        },
    );
}
