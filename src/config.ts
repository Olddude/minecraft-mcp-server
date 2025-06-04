/**
 * This module provides configuration for the application.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { MinecraftMcpConfig } from '@minecraft-mcp-server/types';

export const defaultParseIntRadix = 10;
export const defaultMinecraftHost = 'localhost';
export const defaultMinecraftPort = '25565';
export const defaultBotUsername = 'LLMBot';
export const defaultMcrconHost = defaultMinecraftHost;
export const defaultMcrconPort = '25575';
export const defaultMcrconPass = 'minecraft';
export const defaultClient = false;

/**
 * Parses the package.json file to extract application metadata.
 * @returns Parsed package.json content.
 */
function parsePackageJson() {
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson;
}

/**
 * Parses command line arguments using yargs.
 * @returns Parsed command line arguments.
 */
function parseCommandLineArgs() {
    const args = process.argv.slice(2);
    const client = args.includes('--client') || args.includes('-c');
    return {
        client: client,
    };
}

/**
 * Creates a configuration object for the application.
 * @returns configuration settings object.
 */
export function createConfig(): MinecraftMcpConfig {
    const packageJson = parsePackageJson();
    const args = parseCommandLineArgs();
    return {
        name: packageJson.name,
        description: packageJson.description,
        version: packageJson.version,
        minecraftHost: String(process.env.MINECRAFT_HOST ?? defaultMinecraftHost),
        minecraftPort: Number.parseInt(process.env.MINECRAFT_PORT ?? defaultMinecraftPort, defaultParseIntRadix),
        mcrconHost: String(process.env.MCRCON_HOST ?? defaultMcrconHost),
        mcrconPort: Number.parseInt(process.env.MCRCON_PORT ?? defaultMcrconPort, defaultParseIntRadix),
        mcrconPass: String(process.env.MCRCON_PASS ?? defaultMcrconPass),
        client: args.client,
    };
};
