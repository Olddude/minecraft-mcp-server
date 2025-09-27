#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import { join, dirname } from 'path';
import { config } from 'dotenv';

const execAsync = promisify(exec);

// Get script directory
const scriptPath = process.argv[1];
const scriptDir = dirname(scriptPath);
const rootDir = join(scriptDir, '..');

// Change to root directory
process.chdir(rootDir);

// Load environment variables
config({ path: '.env' });

/**
 * Find and kill processes using a specific port
 */
async function killPortProcesses(port: number): Promise<void> {
    console.log(`Looking for processes using port ${port}...`);

    try {
        // Find PIDs using lsof (cross-platform tool)
        const { stdout } = await execAsync(`lsof -ti:${port}`, { encoding: 'utf8' });
        const pids = stdout.trim().split('\n').filter(pid => pid.length > 0);

        if (pids.length === 0) {
            console.log(`No processes found using port ${port}`);
            return;
        }

        // Show processes before killing
        console.log(`Found processes using port ${port}:`);
        try {
            const { stdout: processInfo } = await execAsync(`lsof -i:${port}`, { encoding: 'utf8' });
            console.log(processInfo);
        } catch {
            // Ignore if lsof fails to get detailed info
        }

        // Kill each process
        for (const pid of pids) {
            try {
                console.log(`Killing process ${pid}...`);
                process.kill(parseInt(pid, 10));
                console.log(`Successfully killed process ${pid}`);
            } catch (error) {
                console.error(`Failed to kill process ${pid}:`, error);
            }
        }
    } catch {
        // No processes found (lsof returns non-zero when no processes match)
        console.log(`No processes found using port ${port}`);
    }
}

/**
 * Parse command line arguments and validate port
 */
function parseArgs(): number {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('Usage: ts-node kill.ts <port>');
        console.error('Example: ts-node kill.ts 3000');
        process.exit(1);
    }

    const port = parseInt(args[0], 10);

    if (isNaN(port) || port < 1 || port > 65535) {
        console.error(`Error: '${args[0]}' is not a valid port number (1-65535)`);
        process.exit(1);
    }

    return port;
}

/**
 * Main execution
 */
async function main(): Promise<void> {
    const port = parseArgs();

    try {
        await killPortProcesses(port);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Execute if this is the main module
if (require.main === module) {
    main();
}

export { killPortProcesses };
