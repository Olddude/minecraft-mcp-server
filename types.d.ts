
declare module 'mineflayer-pathfinder' {
  export class Movements {
      constructor(bot: Bot, mcData: unknown);
  }
}

declare module '@olddude/minecraft-server-java' {
  type McpResponse = {
    content: ContentItem[];
    _meta?: Record<string, unknown>;
    isError?: boolean;
    [key: string]: unknown;
  };

  type TextContent = {
    type: 'text';
    text: string;
  };

  type ContentItem = TextContent;

  type McpResponse = {
    content: ContentItem[];
    _meta?: Record<string, unknown>;
    isError?: boolean;
    [key: string]: unknown;
  };

  interface InventoryItem {
    name: string;
    count: number;
    slot: number;
  }

  interface FaceOption {
    direction: string;
    vector: Vec3;
  }

  type Direction = 'forward' | 'back' | 'left' | 'right';
  type FaceDirection = 'up' | 'down' | 'north' | 'south' | 'east' | 'west';


  type MinecraftEntity = {
    type: string;
    name: string;
  }

  type EntityFilter = (entity: MinecraftEntity) => boolean;
}
