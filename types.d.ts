declare module '@minecraft-mcp-server/types' {
  import type { Vec3 } from 'vec3';
  import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
  import type { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
  import type { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
  import type { Client } from '@modelcontextprotocol/sdk/client/index';

  /**
   * Logger type for consistent logging across the application
   */
  type Logger = {
    trace(message: string, ...args: unknown[]): void;
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    fatal(message: string, ...args: unknown[]): void;
  };

  /**
   * Log levels supported by the application
   */
  type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

  /**
   * Logging configuration
   */
  type LoggingConfig = {
    level: LogLevel;
    enableConsole: boolean;
    enableFile: boolean;
    filePattern: string;
    maxLogSize: string;
    backups: number;
    compress: boolean;
  };

  type ResourceTemplate = {
    name: string;
    description: string;
    category: string;
    commands: string[];
    materials: string[];
    dimensions?: string;
    notes?: string[];
  }

  type MinecraftMcpClient = Client;
  type MinecraftClientTransport = StdioClientTransport;
  type MinecraftMcpServer = McpServer;
  type MinecraftStdioServerTransport = StdioServerTransport;

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

  type MinecraftMcpConfig = {
    client: boolean;
    name: string;
    description: string;
    version: string;
    minecraftHost: string;
    minecraftPort: number;
    mcrconHost: string;
    mcrconPort: number;
    mcrconPass: string;
  };

}
