import { createServer, IncomingMessage, ServerResponse } from 'http';
import { EventEmitter } from 'events';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../logging';

export interface HTTPStreamingServerConfig {
    host?: string;
    port?: number;
    path?: string;
    corsOrigins?: string[];
}

export class HTTPStreamingServerTransport extends EventEmitter implements Transport {
    private server: ReturnType<typeof createServer> | null = null;
    private connections = new Set<ServerResponse>();
    private config: Required<HTTPStreamingServerConfig>;

    constructor(config?: HTTPStreamingServerConfig) {
        super();
        this.config = {
            host: config?.host || 'localhost',
            port: config?.port || 3002,
            path: config?.path || '/stream',
            corsOrigins: config?.corsOrigins || ['*'],
        };
    }

    start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server = createServer((req, res) => {
                this.handleRequest(req, res);
            });

            this.server.on('error', reject);

            this.server.listen(this.config.port, this.config.host, () => {
                resolve();
            });
        });
    }

    private handleRequest(req: IncomingMessage, res: ServerResponse): void {
        const url = new URL(req.url || '', `http://${req.headers.host}`);

        if (url.pathname !== this.config.path) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }

        // Set CORS headers
        this.setCORSHeaders(res);

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        if (req.method === 'POST') {
            this.handleStreamingConnection(req, res);
        } else {
            res.writeHead(405);
            res.end('Method Not Allowed');
        }
    }

    private setCORSHeaders(res: ServerResponse): void {
        res.setHeader('Access-Control-Allow-Origin', this.config.corsOrigins.join(', '));
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    private handleStreamingConnection(req: IncomingMessage, res: ServerResponse): void {
        res.writeHead(200, {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });

        this.connections.add(res);

        let buffer = '';
        req.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const message = JSON.parse(line) as JSONRPCMessage;
                        this.emit('message', message);
                    } catch (error) {
                        logger.error('Failed to parse JSON-RPC message:', error);
                    }
                }
            }
        });

        req.on('end', () => {
            if (buffer.trim()) {
                try {
                    const message = JSON.parse(buffer) as JSONRPCMessage;
                    this.emit('message', message);
                } catch (error) {
                    logger.error('Failed to parse final JSON-RPC message:', error);
                }
            }
        });

        req.on('close', () => {
            this.connections.delete(res);
        });

        res.on('close', () => {
            this.connections.delete(res);
        });
    }

    send(message: JSONRPCMessage): Promise<void> {
        return new Promise((resolve) => {
            const data = `${JSON.stringify(message) }\n`;

            for (const connection of this.connections) {
                try {
                    connection.write(data);
                } catch (error) {
                    logger.error('Failed to send message to connection:', error);
                    this.connections.delete(connection);
                }
            }

            resolve();
        });
    }

    close(): Promise<void> {
        return new Promise((resolve) => {
            for (const connection of this.connections) {
                connection.end();
            }
            this.connections.clear();

            if (this.server) {
                this.server.close(() => {
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

export function createHTTPStreamingServerTransport(config?: HTTPStreamingServerConfig): HTTPStreamingServerTransport {
    logger.debug('Creating HTTP streaming server transport', { config });
    const transport = new HTTPStreamingServerTransport(config);
    logger.info('HTTP streaming server transport created successfully', { config });
    return transport;
}
