import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z as zod } from 'zod';
import { InventoryItem, McpResponse } from '@olddude/minecraft-server-java';
import mineflayer from 'mineflayer';
import { createErrorResponse, createResponse } from '../response';

export function registerInventoryTools(server: McpServer, bot: mineflayer.Bot) {
    server.tool(
        'list-inventory',
        "List all items in the bot's inventory",
        {},
        async (): Promise<McpResponse> => {
            try {
                await Promise.resolve();
                const items = bot.inventory.items();
                const itemList: InventoryItem[] = items.map((item) => ({
                    name: item.name,
                    count: item.count,
                    slot: item.slot,
                }));

                if (items.length === 0) {
                    return createResponse('Inventory is empty');
                }

                let inventoryText = `Found ${items.length} items in inventory:\n\n`;
                itemList.forEach(item => {
                    inventoryText += `- ${item.name} (x${item.count}) in slot ${item.slot}\n`;
                });

                return createResponse(inventoryText);
            } catch (error) {
                return createErrorResponse(error as Error);
            }
        },
    );

    server.tool(
        'find-item',
        "Find a specific item in the bot's inventory",
        {
            nameOrType: zod.string().describe('Name or type of item to find'),
        },
        async ({ nameOrType }): Promise<McpResponse> => {
            try {
                await Promise.resolve();
                const items = bot.inventory.items();
                const item = items.find((inventoryItem: InventoryItem) =>
                    inventoryItem.name.includes(nameOrType.toLowerCase()),
                );

                if (item) {
                    return createResponse(`Found ${item.count} ${item.name} in inventory (slot ${item.slot})`);
                }
                return createResponse(`Couldn't find any item matching '${nameOrType}' in inventory`);

            } catch (error) {
                return createErrorResponse(error as Error);
            }
        },
    );

    server.tool(
        'equip-item',
        'Equip a specific item',
        {
            itemName: zod.string().describe('Name of the item to equip'),
            destination: zod.string().optional().describe("Where to equip the item (default: 'hand')"),
        },
        async ({ itemName, destination = 'hand' }): Promise<McpResponse> => {
            try {
                const items = bot.inventory.items();
                const item = items.find((inventoryItem: InventoryItem) =>
                    inventoryItem.name.includes(itemName.toLowerCase()),
                );

                if (!item) {
                    return createResponse(`Couldn't find any item matching '${itemName}' in inventory`);
                }

                await bot.equip(item, destination as mineflayer.EquipmentDestination);
                return createResponse(`Equipped ${item.name} to ${destination}`);
            } catch (error) {
                return createErrorResponse(error as Error);
            }
        },
    );
}
