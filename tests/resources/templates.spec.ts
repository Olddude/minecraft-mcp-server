import { handleTemplatesListRequest } from '@/src/resources/templates/protocol';
import { getAllTemplates } from '@/src/resources/templates/utils';
import type { JSONRPCRequest } from '@modelcontextprotocol/sdk/types';

describe('handleTemplatesListRequest', () => {
    it('returns the correct response for resources/templates/list', () => {
        const request: JSONRPCRequest = {
            jsonrpc: '2.0' as const,
            id: 42,
            method: 'resources/templates/list',
            params: {},
        };
        const response = handleTemplatesListRequest(request);
        expect(response).toBeDefined();
        expect(response.jsonrpc).toBe('2.0');
        expect(response.id).toBe(42);
        expect(response.result).toBeDefined();
        expect(Array.isArray(response.result.resourceTemplates)).toBe(true);
        // Add this guard:
        if (response && response.result && Array.isArray(response.result.resourceTemplates)) {
            expect(response.result.resourceTemplates.length).toBe(getAllTemplates().length);
            for (const t of response.result.resourceTemplates) {
                expect(typeof t.uriTemplate).toBe('string');
                expect(typeof t.name).toBe('string');
                expect(typeof t.description).toBe('string');
                expect(t.mimeType).toBe('application/json');
            }
        }
    });
});
