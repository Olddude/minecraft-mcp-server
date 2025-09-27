declare module '@minecraft-mcp-server/types' {
  import type { Vec3 } from 'vec3';
  import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
  import type { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
  import type { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
  import type { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
  import type { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
  import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

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
  type MinecraftClientTransport = StdioClientTransport | StreamableHTTPClientTransport;
  type MinecraftMcpServer = McpServer;
  type MinecraftStdioServerTransport = StdioServerTransport;
  type MinecraftHttpServerTransport = StreamableHTTPServerTransport;

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
    name: string;
    description: string;
    version: string;
    minecraftHost: string;
    minecraftPort: number;
    mcrconHost: string;
    mcrconPort: number;
    mcrconPass: string;
  };

  /**
   * Command object structure for JSONL format
   */
  type MinecraftCommand = {
    command: string;
  };

  /**
   * Command generator arguments
   */
  type CommandGeneratorArgs = {
    centerX: number;
    centerY: number;
    centerZ: number;
    radius: number;
    outputFile?: string;
  };

  /**
   * Command executor arguments
   */
  type CommandExecutorArgs = {
    inputFile: string;
    batchSize?: number;
    delayMs?: number;
    mcrconPath?: string;
    verbose?: boolean;
  };

  /**
   * Command execution result
   */
  type CommandExecutionResult = {
    command: string;
    success: boolean;
    output: string | null;
    error: string | null;
    index: number;
  };

  /**
   * Command executor options
   */
  type ExecutorOptions = {
    mcrconPath?: string;
    batchSize?: number;
    delayMs?: number;
    verbose?: boolean;
  };

  /**
   * CLI Argument types for validation
   */
  type CLICommandArgs = {
    centerX: string;
    centerY: string;
    centerZ: string;
    radius: string;
    outputFile?: string;
  };

  type CLIExecutorArgs = {
    inputFile?: string;
    batch?: string;
    delay?: string;
    mcrcon?: string;
    verbose?: boolean;
    help?: boolean;
  };
}
