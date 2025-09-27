#!/usr/bin/env node
// exec.ts - Executes Minecraft commands from a JSONL file by piping them to mcrcon.sh
// Uses async generators for efficient streaming and memory usage

import { promises as fs, createReadStream } from 'node:fs';
import readline from 'node:readline';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { z } from 'zod';
import type {
    CommandExecutorArgs,
    ExecutorOptions,
    CommandExecutionResult,
    MinecraftCommand,
} from '@minecraft-mcp-server/types';

// Zod schema for command line arguments
const ExecutorArgsSchema = z.object({
    inputFile: z.string().default('commands.jsonl'),
    batchSize: z.string()
        .optional()
        .transform(val => val ? parseInt(val, 10) : 10)
        .refine(val => !isNaN(val) && val > 0, {
            message: 'batchSize must be a positive integer',
        }),
    delayMs: z.string()
        .optional()
        .transform(val => val ? parseInt(val, 10) : 100)
        .refine(val => !isNaN(val) && val >= 0, {
            message: 'delayMs must be a non-negative integer',
        }),
    mcrconPath: z.string().optional(),
    verbose: z.boolean().default(false),
});

/**
 * Async generator that yields command objects from a JSONL file
 * Each line is a separate JSON object with a 'command' field
 */
export async function* readCommandsFromJsonl(
    filePath: string,
): AsyncGenerator<string> {
    const fileStream = createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        if (line.trim()) {
            try {
                const commandObj = JSON.parse(line) as MinecraftCommand;
                if (commandObj.command) {
                    yield commandObj.command;
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                console.error(`Error parsing line: ${line}`, message);
            }
        }
    }
}

/**
 * Executes a single command via mcrcon
 * Returns a promise that resolves when the command completes
 */
export function executeCommand(
    command: string,
    mcrconPath: string,
): Promise<string> {
    return new Promise((resolve, reject) => {
        // Determine if we're running a TypeScript or shell script
        const isTypeScript = mcrconPath.endsWith('.ts');
        const cmd = isTypeScript ? 'ts-node' : 'bash';
        const args = isTypeScript ? [mcrconPath, command] : [mcrconPath];

        const mcrcon = spawn(cmd, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        let output = '';
        let errorOutput = '';

        mcrcon.stdout.on('data', (data: Buffer) => {
            output += data.toString();
        });

        mcrcon.stderr.on('data', (data: Buffer) => {
            errorOutput += data.toString();
        });

        mcrcon.on('close', (code: number | null) => {
            if (code !== 0 && errorOutput) {
                reject(new Error(`Command failed: ${errorOutput}`));
            } else {
                resolve(output);
            }
        });

        mcrcon.on('error', (error: Error) => {
            reject(error);
        });

        // For shell scripts, send command via stdin; for TypeScript, it's passed as argument
        if (!isTypeScript) {
            mcrcon.stdin.write(`${command}\n`);
        }
        mcrcon.stdin.end();
    });
}

/**
 * Batch executes commands with rate limiting and progress tracking
 */
export async function* batchExecuteCommands(
    commands: AsyncGenerator<string>,
    mcrconPath: string,
    batchSize: number = 10,
    delayMs: number = 100,
): AsyncGenerator<CommandExecutionResult> {
    let batch: string[] = [];
    let totalExecuted = 0;

    for await (const command of commands) {
        batch.push(command);

        if (batch.length >= batchSize) {
            // Execute batch in parallel
            const results = await Promise.allSettled(
                batch.map(cmd => executeCommand(cmd, mcrconPath)),
            );

            for (let i = 0; i < results.length; i++) {
                totalExecuted++;
                const result = results[i];
                yield {
                    command: batch[i],
                    success: result.status === 'fulfilled',
                    output: result.status === 'fulfilled' ? result.value : null,
                    error: result.status === 'rejected' ? result.reason.message : null,
                    index: totalExecuted,
                };
            }

            batch = [];

            // Small delay between batches to avoid overwhelming the server
            if (delayMs > 0) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }

    // Execute remaining commands in the last batch
    if (batch.length > 0) {
        const results = await Promise.allSettled(
            batch.map(cmd => executeCommand(cmd, mcrconPath)),
        );

        for (let i = 0; i < results.length; i++) {
            totalExecuted++;
            const result = results[i];
            yield {
                command: batch[i],
                success: result.status === 'fulfilled',
                output: result.status === 'fulfilled' ? result.value : null,
                error: result.status === 'rejected' ? result.reason.message : null,
                index: totalExecuted,
            };
        }
    }
}

/**
 * Process execution results
 */
async function processResults(
    executor: AsyncGenerator<CommandExecutionResult>,
    verbose: boolean,
): Promise<{ successCount: number; errorCount: number }> {
    let successCount = 0;
    let errorCount = 0;

    for await (const result of executor) {
        if (result.success) {
            successCount++;
            if (verbose && result.output && result.output.trim()) {
                console.log(`✓ [${result.index}] ${result.output.trim()}`);
            }
        } else {
            errorCount++;
            console.error(`✗ [${result.index}] Failed: ${result.error}`);
        }

        // Progress indicator
        if (result.index % 10 === 0) {
            process.stderr.write(`\rProcessed: ${result.index} | Success: ${successCount} | Errors: ${errorCount}`);
        }
    }

    return { successCount, errorCount };
}

/**
 * Main execution function
 */
export async function executeCommands(
    inputFile: string,
    options: ExecutorOptions = {},
): Promise<void> {
    const {
        mcrconPath = join(__dirname, 'mcrcon.ts'),
        batchSize = 10,
        delayMs = 100,
        verbose = false,
    } = options;

    // Check if mcrcon script exists
    try {
        await fs.access(mcrconPath, fs.constants.R_OK);
    } catch {
        throw new Error(`mcrcon script not found at ${mcrconPath}`);
    }

    // Check if input file exists
    try {
        await fs.access(inputFile, fs.constants.R_OK);
    } catch {
        throw new Error(`Input file not found or not readable at ${inputFile}`);
    }

    console.log(`Executing commands from ${inputFile}...`);
    console.log(`Batch size: ${batchSize}, Delay: ${delayMs}ms`);

    // Read commands and execute them
    const commands = readCommandsFromJsonl(inputFile);
    const executor = batchExecuteCommands(commands, mcrconPath, batchSize, delayMs);
    const { successCount, errorCount } = await processResults(executor, verbose);

    console.log('\n\nExecution complete!');
    console.log(`Total commands: ${successCount + errorCount}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}

/**
 * Display help message
 */
function showHelp(): never {
    console.log('Usage: ts-node exec.ts [options] <jsonl-file>');
    console.log('\nOptions:');
    console.log('  -b, --batch <size>    Batch size for parallel execution (default: 10)');
    console.log('  -d, --delay <ms>      Delay between batches in milliseconds (default: 100)');
    console.log('  -m, --mcrcon <path>   Path to mcrcon.ts (default: ./scripts/mcrcon.ts)');
    console.log('  -v, --verbose         Show command outputs');
    console.log('  -h, --help            Show this help message');
    console.log('\nExamples:');
    console.log('  ts-node exec.ts commands.jsonl');
    console.log('  ts-node exec.ts -b 20 -d 50 -v commands.jsonl');
    console.log('  ts-node exec.ts --batch 5 --delay 200 --verbose commands.jsonl');
    process.exit(0);
}

/**
 * Parse raw arguments from command line
 */
function parseRawArgs(args: string[]): Record<string, string | boolean> {
    const rawArgs: Record<string, string | boolean> = { verbose: false };
    let inputFile: string | undefined;

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
        case '-b':
        case '--batch':
            rawArgs.batchSize = args[++i];
            break;
        case '-d':
        case '--delay':
            rawArgs.delayMs = args[++i];
            break;
        case '-m':
        case '--mcrcon':
            rawArgs.mcrconPath = args[++i];
            break;
        case '-v':
        case '--verbose':
            rawArgs.verbose = true;
            break;
        default:
            if (!inputFile && !args[i].startsWith('-')) {
                inputFile = args[i];
            }
        }
    }

    rawArgs.inputFile = inputFile || 'commands.jsonl';
    return rawArgs;
}

/**
 * Parse command line arguments using Zod
 */
function parseArgs(): CommandExecutorArgs {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        showHelp();
    }

    const rawArgs = parseRawArgs(args);

    try {
        const validated = ExecutorArgsSchema.parse(rawArgs);
        return {
            inputFile: validated.inputFile,
            batchSize: validated.batchSize,
            delayMs: validated.delayMs,
            mcrconPath: validated.mcrconPath,
            verbose: validated.verbose,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Validation errors:');
            error.errors.forEach(err => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`);
            });
        } else {
            console.error('Error parsing arguments:', error);
        }
        process.exit(1);
    }

    // This should never be reached due to process.exit above
    throw new Error('Unreachable code');
}

/**
 * Main execution
 */
async function main(): Promise<void> {
    const args = parseArgs();

    try {
        await executeCommands(args.inputFile, {
            batchSize: args.batchSize,
            delayMs: args.delayMs,
            mcrconPath: args.mcrconPath,
            verbose: args.verbose,
        });
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Execute if this is the main module
if (require.main === module) {
    main();
}
