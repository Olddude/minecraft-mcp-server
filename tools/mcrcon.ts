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
 * Execute mcrcon command with provided arguments
 */
function executeMcrcon(args: string[]): Promise<void> {
    const mcrconHost = process.env.MCRCON_HOST || 'localhost';
    const mcrconPort = process.env.MCRCON_PORT || '25575';
    const mcrconPass = process.env.MCRCON_PASS || 'minecraft';

    console.log(`mcrcon_host: ${mcrconHost}`);
    console.log(`mcrcon_port: ${mcrconPort}`);
    console.log(`mcrcon_pass: ${mcrconPass}`);

    const mcrconBin = 'mcrcon';

    return new Promise((resolve, reject) => {
        const mcrcon = spawn(mcrconBin, [
            '-H', mcrconHost,
            '-P', mcrconPort,
            '-p', mcrconPass,
            ...args,
        ], {
            stdio: 'inherit',
        });

        mcrcon.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`mcrcon exited with code ${code}`));
            } else {
                resolve();
            }
        });

        mcrcon.on('error', (error) => {
            reject(new Error(`Failed to start mcrcon: ${error.message}`));
        });
    });
}

/**
 * Main execution
 */
async function main(): Promise<void> {
    const args = process.argv.slice(2);

    try {
        await executeMcrcon(args);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Execute if this is the main module
if (require.main === module) {
    main();
}

export { executeMcrcon };
