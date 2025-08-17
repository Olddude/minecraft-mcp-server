import type { MinecraftMcpConfig } from '@minecraft-mcp-server/types';

export const defaultParseIntRadix = 10;
export const defaultMinecraftHost = 'localhost';
export const defaultMinecraftPort = '25565';
export const defaultBotUsername = 'LLMBot';
export const defaultMcrconHost = defaultMinecraftHost;
export const defaultMcrconPort = '25575';
export const defaultMcrconPass = 'minecraft';

/**
 * Creates a configuration object for the application.
 * @returns configuration settings object.
 */
export function createConfig(): MinecraftMcpConfig {
    const packageJson = {
        name: 'minecraft-mcp',
        description: 'Minecraft Model Context Protocol',
        version: '0.1.0',
    };
    return {
        name: packageJson.name,
        description: packageJson.description,
        version: packageJson.version,
        minecraftHost: String(process.env.MINECRAFT_HOST ?? defaultMinecraftHost),
        minecraftPort: Number.parseInt(process.env.MINECRAFT_PORT ?? defaultMinecraftPort, defaultParseIntRadix),
        mcrconHost: String(process.env.MCRCON_HOST ?? defaultMcrconHost),
        mcrconPort: Number.parseInt(process.env.MCRCON_PORT ?? defaultMcrconPort, defaultParseIntRadix),
        mcrconPass: String(process.env.MCRCON_PASS ?? defaultMcrconPass),
    };
};
