import { promises as fs } from 'node:fs';
import { z } from 'zod';
import type {
    CommandGeneratorArgs,
    MinecraftCommand,
} from '@minecraft-mcp-server/types';

/**
 * Normalizes a Minecraft command string by trimming leading/trailing whitespace and newlines
 */
function normalizeCommand(cmd: string): string {
    return cmd.replace(/^[\s\n]+|[\s\n]+$/g, '');
}

// Zod schema for command line arguments
const CommandArgsSchema = z.object({
    centerX: z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val), {
            message: 'centerX must be a valid integer',
        }),
    centerY: z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val), {
            message: 'centerY must be a valid integer',
        }),
    centerZ: z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val), {
            message: 'centerZ must be a valid integer',
        }),
    radius: z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val > 0, {
            message: 'radius must be a positive integer',
        }),
    outputFile: z.string().optional().default('commands.jsonl'),
});

/**
 * Async generator that yields Minecraft commands to convert water to blue ice
 * in a counter-clockwise spiral pattern
 */
export async function* generateIceCommands(
    centerX: number,
    centerY: number,
    centerZ: number,
    radius: number,
): AsyncGenerator<MinecraftCommand> {
    for (let r = 0; r <= radius; r++) {
        yield* generateSpiralLayerCommands(centerX, centerY, centerZ, r);
    }
}

function* generateSpiralLayerCommands(
    centerX: number,
    centerY: number,
    centerZ: number,
    r: number,
): Generator<MinecraftCommand> {
    if (r === 0) {
        yield {
            command: normalizeCommand([
                'execute if block',
                centerX,
                centerY,
                centerZ,
                'minecraft:water',
                'run',
                'setblock',
                centerX,
                centerY,
                centerZ,
                'minecraft:blue_ice'
            ].join(' ')),
        };
        return;
    }

    yield* generateLeftEdge(centerX, centerY, centerZ, r);
    yield* generateTopEdge(centerX, centerY, centerZ, r);
    yield* generateRightEdge(centerX, centerY, centerZ, r);
    yield* generateBottomEdge(centerX, centerY, centerZ, r);
    yield* generateInnerArea(centerX, centerY, centerZ, r);
    r: number,
): Generator<MinecraftCommand> {
    for (let z1 = -r; z1 <= r; z1++) {
        const x = centerX - r;
        const y = centerY;
        const zCoord = centerZ + z1;
        yield {
            command: normalizeCommand([
                'execute if block',
                x,
                y,
                zCoord,
                'minecraft:water',
                'run',
                'setblock',
                x,
                y,
                zCoord,
                'minecraft:blue_ice'
            ].join(' ')),
        };
        };
    };
// ...existing code...
// ...existing code...

function* generateTopEdge(
    centerX: number,
    centerY: number,
    centerZ: number,
    r: number,
): Generator<MinecraftCommand> {
    for (let x1 = -r + 1; x1 <= r; x1++) {
        const xCoord = centerX + x1;
        const y = centerY;
        const zTop = centerZ + r;
        yield {
            command: normalizeCommand([
                'execute if block',
                xCoord,
                y,
                zTop,
                'minecraft:water',
                'run',
                'setblock',
                xCoord,
                y,
                zTop,
                'minecraft:blue_ice'
            ].join(' ')),
        };
        };
    };
// ...existing code...
// ...existing code...

function* generateRightEdge(
    centerX: number,
    centerY: number,
    centerZ: number,
    r: number,
): Generator<MinecraftCommand> {
    for (let z2 = r - 1; z2 >= -r; z2--) {
        const x = centerX + r;
        const y = centerY;
        const zCoord = centerZ + z2;
        yield {
            command: normalizeCommand([
                'execute if block',
                x,
                y,
                zCoord,
                'minecraft:water',
                'run',
                'setblock',
                x,
                y,
                zCoord,
                'minecraft:blue_ice'
            ].join(' ')),
        };
        };
    };
// ...existing code...
// ...existing code...

function* generateBottomEdge(
    centerX: number,
    centerY: number,
    centerZ: number,
    r: number,
): Generator<MinecraftCommand> {
    for (let x2 = r - 1; x2 >= -r + 1; x2--) {
        const xCoord = centerX + x2;
        const y = centerY;
        const zBottom = centerZ - r;
        yield {
            command: normalizeCommand([
                'execute if block',
                xCoord,
                y,
                zBottom,
                'minecraft:water',
                'run',
                'setblock',
                xCoord,
                y,
                zBottom,
                'minecraft:blue_ice'
            ].join(' ')),
        };
        };
    };
// ...existing code...
// ...existing code...

function* generateInnerArea(
    centerX: number,
    centerY: number,
    centerZ: number,
    r: number,
): Generator<MinecraftCommand> {
    for (let x3 = -r + 1; x3 < r; x3++) {
        for (let z3 = -r + 1; z3 < r; z3++) {
            // Skip if this block was already covered in an inner layer
            if (Math.abs(x3) < r && Math.abs(z3) < r) {
                continue;
            }

            const xCoord = centerX + x3;
            const y = centerY;
            const zCoord = centerZ + z3;
            yield {
                command: normalizeCommand([
                    'execute if block',
                    xCoord,
                    y,
                    zCoord,
                    'minecraft:water',
                    'run',
                    'setblock',
                    xCoord,
                    y,
                    zCoord,
                    'minecraft:blue_ice'
                ].join(' ')),
            };
            };
        };
    }
// ...existing code...
// ...existing code...

/**
 * Writes commands to a JSONL file (one JSON object per line)
 * Uses streaming for efficient memory usage
 */
export async function writeCommandsToJsonl(
    args: CommandGeneratorArgs,
): Promise<void> {
    const {
        centerX,
        centerY,
        centerZ,
        radius,
        outputFile = 'commands.jsonl',
    } = args;
    const stream = await fs.open(outputFile, 'w');
    let count = 0;

    try {
        for await (const commandObj of generateIceCommands(
            centerX,
            centerY,
            centerZ,
            radius,
        )) {
            await stream.write(`${JSON.stringify(commandObj)}\n`);
            count++;

            // Progress indicator every 100 commands
            if (count % 100 === 0) {
                process.stderr.write(`\rGenerated ${count} commands...`);
            }
        }

        process.stderr.write(`\rGenerated ${count} total commands\n`);
        console.log(`Commands written to ${outputFile}`);
    } finally {
        await stream.close();
    }
}

/**
 * Parse command line arguments using Zod
 */
function parseArgs(): CommandGeneratorArgs {
    const args = process.argv.slice(2);

    if (args.length < 4) {
        console.log(
            'Usage: ts-node command.ts <centerX> <centerY> <centerZ> <radius> [outputFile]',
        );
        console.log('Example: ts-node command.ts -1049 62 -197 20 commands.jsonl');
        console.log('\nDefaults to commands.jsonl if no output file specified');
        process.exit(1);
    }

    const rawArgs = {
        centerX: args[0],
        centerY: args[1],
        centerZ: args[2],
        radius: args[3],
        outputFile: args[4],
    };

    try {
        const validated = CommandArgsSchema.parse(rawArgs);
        return {
            centerX: validated.centerX,
            centerY: validated.centerY,
            centerZ: validated.centerZ,
            radius: validated.radius,
            outputFile: validated.outputFile,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Validation errors:');
            error.errors.forEach((err) => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`);
            });
        } else {
            console.error('Error parsing arguments:', error);
        }
        process.exit(1);
        return {
            centerX: 0,
            centerY: 0,
            centerZ: 0,
            radius: 1,
            outputFile: 'commands.jsonl',
        };
    }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
    const args = parseArgs();

    try {
        await writeCommandsToJsonl(args);
    } catch (error) {
        console.error('Error generating commands:', error);
        process.exit(1);
    }
}

// Execute if this is the main module
if (require.main === module) {
    main();
}
