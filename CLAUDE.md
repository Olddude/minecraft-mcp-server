# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Security Requirements

**CRITICAL: Never read or access `.env` files or any `*.env*` pattern files.** These contain sensitive environment variables. When configuration help is needed, use placeholder values and reference documentation instead.

## Development Commands

### Building and Running

- `npm run build:backend` - Build backend with esbuild
- `npm run build:frontend` - Build frontend with esbuild  
- `npm run start:backend:debug` - Run backend in development mode with TypeScript
- `npm run start:backend:release` - Run built backend
- `npm run start:frontend:debug` - Run frontend in development mode
- `npm run start:frontend:release` - Run built frontend

### Testing and Quality

- `npm test` - Run tests in watch mode
- `npm run test:ci` - Run tests with coverage for CI
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run inspector` - Launch MCP inspector tool

### Running Single Tests

Jest is configured to find test files in `tests/**/*.spec.ts`. Run specific tests with:

```bash
npx jest tests/backend/tools/tools.spec.ts
```

## Architecture Overview

This is a **Model Context Protocol (MCP) server** for Minecraft command execution via mcrcon. The architecture is split into three main components:

### Backend (MCP Server)

Located in `src/backend/`, this is the core MCP server that:

- **Multiple Transport Support**: Supports stdio, SSE, and HTTP streaming transports controlled by `MCP_TRANSPORT` environment variable
- **Three MCP Tools**: `execute-command`, `execute-sequential-command-batch`, `execute-parallel-command-batch`
- **Express API**: REST endpoints at `/tools/`, `/docs/`, and OpenAI-compatible routes
- **Resource Templates**: Pre-built Minecraft construction patterns and documentation

### Frontend (MCP Client)  

Located in `src/frontend/`, this demonstrates client usage:

- **HTTP Client Transport**: Connects to backend via HTTP streaming
- **Multiple Transport Options**: Includes stdio, SSE, and HTTP implementations

### Shared Components

Located in `src/shared/`:

- **Logging**: Centralized log4js configuration with file and console outputs

## Key Configuration

### Transport Selection

The backend supports three transports via `MCP_TRANSPORT` environment variable:

- `stdio` (default for MCP clients like VS Code)
- `sse` (Server-Sent Events)  
- `http-streaming` (default, includes Express server on port 3000)

### VS Code MCP Integration

The `.vscode/mcp.json` configures VS Code to use this server with stdio transport.

## Type System

All types are centralized in `types.d.ts` under the `@minecraft-mcp-server/types` module, including:

- `MinecraftMcpConfig` - Server configuration
- `McpResponse` - Standardized response format
- `ResourceTemplate` - Building pattern definitions

## File Structure Patterns

- `tools/` - MCP tool implementations (one file per tool)
- `helpers/` - Command execution utilities  
- `resources/templates/` - Minecraft building patterns
- `routes/` - Express API endpoints
- `transport/` - Client transport implementations

## Required Environment Variables

```text
MCRCON_HOST=localhost
MCRCON_PORT=25575  
MCRCON_PASS=your_rcon_password
MINECRAFT_HOST=localhost
MINECRAFT_PORT=25565
```

## MCP Tools Usage

The server provides three tools for Minecraft command execution:

1. **execute-command**: Single command execution
2. **execute-sequential-command-batch**: Commands executed in order
3. **execute-parallel-command-batch**: Commands executed simultaneously

Always test commands with `execute-command` before using batch operations.
