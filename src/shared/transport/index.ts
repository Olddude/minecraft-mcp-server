// STDIO transports
export { createStdioClientTransport } from './stdio-client';
export { createStdioServerTransport, patchStdioTransportForTemplates } from './stdio-server';

// SSE transports
export {
    createSSEClientTransport,
    createSSEClientTransportFromConfig,
    type SSEClientConfig,
} from './sse-client';
export {
    createSSEServerTransport,
    createSSEServerTransportFromConfig,
    type SSEServerConfig,
} from './sse-server';

// HTTP Streaming transports
export {
    createHTTPStreamingClientTransport,
    HTTPStreamingClientTransport,
    type HTTPStreamingClientConfig,
} from './http-streaming-client';
export {
    createHTTPStreamingServerTransport,
    HTTPStreamingServerTransport,
    type HTTPStreamingServerConfig,
} from './http-streaming-server';
