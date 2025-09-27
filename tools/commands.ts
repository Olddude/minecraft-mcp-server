import { join } from 'node:path';
import { executeCommands } from './exec';

/**
 * Execute commands from a JSONL file
 */
async function runCommands(): Promise<void> {
    const inputFile = 'commands.jsonl';

    console.log(`Executing commands from ${inputFile}...`);

    try {
        await executeCommands(inputFile, {
            mcrconPath: join(scriptDir, 'mcrcon.ts'),
            batchSize: 10,
            delayMs: 100,
            verbose: false,
        });
    } catch (error) {
        console.error('Error executing commands:', error);
        process.exit(1);
    }
}

// Execute if this is the main module
if (require.main === module) {
    runCommands();
}

export { runCommands };
