import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { EntityFilter, McpResponse, MinecraftBot, MinecraftEntity } from '@olddude/minecraft-server-java';
import { createErrorResponse, createResponse } from '../response';

export function registerEntityTools(server: McpServer, bot: MinecraftBot) {
    server.tool(
        'find-entity',
        'Find the nearest entity of a specific type',
        {
            type: z.string().optional().describe('Type of entity to find (empty for any entity)'),
            maxDistance: z.number().optional().describe('Maximum search distance (default: 16)'),
        },
        async ({ type = '', maxDistance = 16 }): Promise<McpResponse> => {
            try {
                await Promise.resolve();
                const entityFilter: EntityFilter = (e: MinecraftEntity) => {
                    if (!type) {return true;}
                    if (type === 'player') {return e.type === 'player';}
                    if (type === 'mob') {return e.type === 'mob';}
                    const hasEntity = e.name.includes(type.toLowerCase());
                    return hasEntity;
                };

                const entity = bot.nearestEntity(entityFilter);

                if (!entity || bot.entity.position.distanceTo(entity.position) > maxDistance) {
                    return createResponse(`No ${type || 'entity'} found within ${maxDistance} blocks`);
                }

                return createResponse(`Found ${entity.name || (entity as any).username || entity.type} at position (${Math.floor(entity.position.x)}, ${Math.floor(entity.position.y)}, ${Math.floor(entity.position.z)})`);
            } catch (error) {
                return createErrorResponse(error as Error);
            }
        },
    );
}
