import { EventEmitter } from 'events';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '@/src/frontend/logging';

export interface HTTPStreamingClientConfig {
    url: string;
    headers?: Record<string, string>;
    timeout?: number;
}

export class HTTPStreamingClientTransport extends EventEmitter implements Transport {
    private config: HTTPStreamingClientConfig;
    private controller: AbortController | null = null;
    private writer: WritableStreamDefaultWriter<string> | null = null;
    private connected = false;

    constructor(config: HTTPStreamingClientConfig) {
        super();
        this.config = {
            timeout: 30000,
            ...config,
        };
    }

    async start(): Promise<void> {
        this.controller = new AbortController();

        const { readable, writable } = new TransformStream();
        this.writer = writable.getWriter();

        const response = await fetch(this.config.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-ndjson',
                'Accept': 'application/x-ndjson',
                ...this.config.headers,
            },
            body: readable,
            signal: this.controller.signal,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        this.connected = true;
        this.handleResponse(response);
    }

    private async handleResponse(response: Response): Promise<void> {
        if (!response.body) {
            throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const buffer = '';

        try {
            await this.processResponseStream(reader, decoder, buffer);
        } catch (error) {
            if (!this.controller?.signal.aborted) {
                this.emit('error', error);
            }
        } finally {
            this.connected = false;
            reader.releaseLock();
        }
    }

    private async processResponseStream(
        reader: ReadableStreamDefaultReader<Uint8Array>,
        decoder: typeof TextDecoder.prototype,
        initialBuffer: string,
    ): Promise<void> {
        let buffer = initialBuffer;
        while (true) {
            const { done, value } = await reader.read();

            if (done) {break;}

            buffer += decoder.decode(value, { stream: true });
            buffer = this.processBufferLines(buffer);
        }
    }

    private processBufferLines(buffer: string): string {
        const lines = buffer.split('\n');
        const remaining = lines.pop() || '';

        for (const line of lines) {
            if (line.trim()) {
                this.parseAndEmitMessage(line);
            }
        }

        return remaining;
    }

    private parseAndEmitMessage(line: string): void {
        try {
            const message = JSON.parse(line) as JSONRPCMessage;
            this.emit('message', message);
        } catch (error) {
            logger.error('Failed to parse JSON-RPC message:', error);
        }
    }

    async send(message: JSONRPCMessage): Promise<void> {
        if (!this.connected || !this.writer) {
            throw new Error('Transport not connected');
        }

        const data = `${JSON.stringify(message) }\n`;
        await this.writer.write(data);
    }

    async close(): Promise<void> {
        this.connected = false;

        if (this.writer) {
            await this.writer.close();
            this.writer = null;
        }

        if (this.controller) {
            this.controller.abort();
            this.controller = null;
        }
    }
}

export function createHTTPStreamingClientTransport(config: HTTPStreamingClientConfig): HTTPStreamingClientTransport {
    logger.debug('Creating HTTP streaming client transport', { config });
    const transport = new HTTPStreamingClientTransport(config);
    logger.info('HTTP streaming client transport created successfully', { url: config.url });
    return transport;
}
