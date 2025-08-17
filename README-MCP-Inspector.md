# MCP Inspector Setup

This document explains how to use the MCP Inspector with your Minecraft MCP Backend.

## Quick Start

### Debug Mode (TypeScript)

```bash
npm run inspect:backend:debug
```

### Release Mode (Built JavaScript)

```bash
npm run inspect:backend:release
```

## Manual Usage

You can also run the inspector directly:

```bash
# Debug mode
npx @modelcontextprotocol/inspector node -r tsconfig-paths/register -r ts-node/register -r dotenv/config src/backend/index.ts

# Release mode  
npx @modelcontextprotocol/inspector node -r dotenv/config dist/backend/index.js
```

## Configuration

The inspector is configured in `mcp-inspector.config.json` with two server profiles:

- **minecraft-backend-debug**: Runs TypeScript source with development settings
- **minecraft-backend-release**: Runs built JavaScript with production settings

## Accessing the Inspector

Once started, the inspector provides:

- **MCP Inspector UI**: <http://localhost:6274> (browser interface)
- **MCP Proxy Server**: <http://localhost:6277> (proxy endpoint)

## Available Tools

The inspector will show the following tools from your Minecraft MCP server:

1. **execute-command**: Execute single Minecraft commands
2. **execute-sequential-command-batch**: Execute multiple commands sequentially
3. **execute-parallel-command-batch**: Execute multiple commands in parallel

## Environment Variables

You can set these environment variables to customize the inspector:

- `CLIENT_PORT`: Inspector UI port (default: 6274)
- `SERVER_PORT`: Proxy server port (default: 6277)

## Troubleshooting

- Ensure your Minecraft server is running and mcrcon is accessible
- Check that the required environment variables are set in your `.env` file
- Verify the backend builds successfully before using release mode
