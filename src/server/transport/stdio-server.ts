import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { JSONRPCRequest, JSONRPCResponse } from '@modelcontextprotocol/sdk/types';
import type { MinecraftStdioServerTransport } from '@minecraft-mcp-server/types';
import { handleTemplatesListRequest } from '@/src/server/resources/templates/protocol';
import { logger } from '@/src/shared/logging';

export function createStdioServerTransport(): MinecraftStdioServerTransport {
    logger.debug('Creating STDIO server transport');
    const transport = new StdioServerTransport();
    logger.info('STDIO server transport created successfully');
    return transport as MinecraftStdioServerTransport;
}

export function patchStdioTransportForTemplates(transport: MinecraftStdioServerTransport): void {
    logger.debug('Patching STDIO transport for template handling');
    // Patch: Intercept raw JSON-RPC for template listing
    // eslint-disable-next-line no-underscore-dangle
    const originalStdioTransportOnDataCallback = transport._ondata?.bind(transport);
    if (originalStdioTransportOnDataCallback) {
        // eslint-disable-next-line no-underscore-dangle, no-param-reassign
        transport._ondata = (chunk: Buffer) => {
            let jsonRpcRequest: JSONRPCRequest | undefined;
            try {
                jsonRpcRequest = JSON.parse(chunk.toString()) as JSONRPCRequest;
            } catch (error) {
                logger.error('Failed to parse JSON-RPC request:', error);
                const parseErrorResponse: JSONRPCResponse = {
                    id: jsonRpcRequest?.id ?? 0,
                    jsonrpc: '2.0',
                    result: {
                        _meta: {
                            mimeType: 'application/json',
                        },
                        error: {
                            code: -32700, // Parse error
                            message: error instanceof Error ? error.message : 'Parse error',
                        },
                    },
                };
                transport.send(parseErrorResponse);
                return;
            }
            if (jsonRpcRequest.method === 'resources/templates/list') {
                logger.debug('Handling templates list request');
                const templatesResponse = handleTemplatesListRequest(jsonRpcRequest);
                transport.send(templatesResponse);
                return;
            }
            originalStdioTransportOnDataCallback(chunk);
        };
        logger.info('STDIO transport patched successfully for template handling');
    } else {
        logger.warn('Unable to patch STDIO transport - original ondata callback not found');
    }
}
