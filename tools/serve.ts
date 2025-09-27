#!/usr/bin/env node
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { config } from 'dotenv';

// Get script directory
const scriptPath = process.argv[1];
const scriptDir = dirname(scriptPath);
const rootDir = join(scriptDir, '..');

// Change to root directory
process.chdir(rootDir);

// Load environment variables
config({ path: '.env' });

/**
 * Run the MCP server with mcpo
 */
function serve(): void {
    // Set MCP_TRANSPORT to stdio for mcpo
    process.env.MCP_TRANSPORT = 'stdio';

    console.log('Starting MCP server with mcpo...');
    console.log('MCP_TRANSPORT:', process.env.MCP_TRANSPORT);

    const mcpo = spawn('uvx', ['mcpo', '--port', '8000', '--', 'npm', 'run', 'start:backend:debug'], {
        stdio: 'inherit',
        env: {
            ...process.env,
            MCP_TRANSPORT: 'stdio',
        },
        cwd: rootDir,
    });

    mcpo.on('close', (code) => {
        if (code !== 0) {
            console.error(`mcpo exited with code ${code}`);
            process.exit(code || 1);
        }
    });

    mcpo.on('error', (error) => {
        console.error('Failed to start mcpo:', error);
        process.exit(1);
    });

    // Handle process termination
    process.on('SIGINT', () => {
        console.log('\nShutting down MCP server...');
        mcpo.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
        console.log('\nShutting down MCP server...');
        mcpo.kill('SIGTERM');
    });
}

// Execute if this is the main module
if (require.main === module) {
    serve();
}

export { serve };
