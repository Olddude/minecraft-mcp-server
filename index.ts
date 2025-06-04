import { createConfig } from './src/config';
import { runAsClient } from './src/client';
import { runAsServer } from './src/server';
import { logger, shutdownLogging } from './src/logging';

/**
 * Application entry point.
 */
async function main() {
    try {
        const config = createConfig();
        logger.info('Starting minecraft-mcp-server with config:', { client: config.client });

        if (config.client) {
            await runAsClient(config);
        } else {
            await runAsServer(config);
        }
    } catch (error) {
        logger.error('Application error:', error);
        process.exit(1);
    }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string) {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    try {
        await shutdownLogging();
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

main();
