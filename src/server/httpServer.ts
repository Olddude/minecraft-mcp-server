import express from 'express';
import type { Server as HttpServer } from 'http';
import type { MinecraftMcpConfig, MinecraftHttpServerTransport } from '@minecraft-mcp-server/types';
import { logger } from './logging';
import { generateOpenApiSpec } from './openapi';

/**
 * Creates and configures an Express server for the MCP transport
 */
export function createHttpServer(
    transport: MinecraftHttpServerTransport,
    config: MinecraftMcpConfig,
    port: number = 3000,
): HttpServer {
    const app = express();

    // Enable CORS for development
    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id, Last-Event-Id');
        res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
        next();
    });

    // Parse JSON bodies
    app.use('/mcp', express.json());

    // Handle MCP endpoint with all HTTP methods
    app.all('/mcp', async (req, res) => {
        try {
            await transport.handleRequest(req, res, req.body);
        } catch (error) {
            logger.error('Error handling MCP request:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: config.name,
            version: config.version,
        });
    });

    // OpenAPI specification endpoint
    app.get('/openapi.json', (req, res) => {
        try {
            const openApiSpec = generateOpenApiSpec(config);
            res.json(openApiSpec);
        } catch (error) {
            logger.error('Error generating OpenAPI spec:', error);
            res.status(500).json({ error: 'Failed to generate OpenAPI specification' });
        }
    });

    // 404 handler for other routes
    app.use((req, res) => {
        res.status(404).json({ error: 'Not Found' });
    });

    // Error handler
    app.use((error: Error, req: express.Request, res: express.Response) => {
        logger.error('Express error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    });

    const server = app.listen(port, () => {
        logger.info(`MCP Express server listening on port ${port}`);
        logger.info(`MCP endpoint available at: http://localhost:${port}/mcp`);
        logger.info(`Health check available at: http://localhost:${port}/health`);
        logger.info(`OpenAPI spec available at: http://localhost:${port}/openapi.json`);
    });

    server.on('error', (error) => {
        logger.error('Express server error:', error);
    });

    return server;
}
