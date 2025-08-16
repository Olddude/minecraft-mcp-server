import type { JSONRPCRequest, JSONRPCResponse } from '@modelcontextprotocol/sdk/types';

import { getAllTemplates } from './utils';

/**
 * Formats all templates for the protocol response.
 */
export function formatTemplatesForProtocol() {
    return getAllTemplates().map(template => ({
        uriTemplate: `minecraft://template/${encodeURIComponent(template.name)}`,
        name: template.name,
        description: template.description,
        mimeType: 'application/json',
    }));
}

export function handleTemplatesListRequest(jsonRpcRequest: JSONRPCRequest): JSONRPCResponse {
    try {
        const resourceTemplates = formatTemplatesForProtocol();
        const successResponse: JSONRPCResponse = {
            jsonrpc: '2.0',
            id: jsonRpcRequest.id ?? 0,
            result: {
                _meta: {
                    mimeType: 'application/json',
                    uriTemplate: 'resources/templates/list',
                },
                resourceTemplates,
            },
        };
        return successResponse;
    } catch (error) {
        const errorResponse: JSONRPCResponse = {
            jsonrpc: '2.0',
            id: jsonRpcRequest.id ?? 0,
            result: {
                _meta: {
                    mimeType: 'application/json',
                    uriTemplate: 'resources/templates/list',
                },
                error: {
                    code: -32603, // Internal error
                    message: error instanceof Error ? error.message : 'Internal error',
                },
            },
        };
        return errorResponse;
    }
}
