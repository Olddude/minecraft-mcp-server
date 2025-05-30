import mineflayer from 'mineflayer';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { createBot } from './src/bot';
import { createMcpServer, createMcpServerTransport } from './src/server';

function parseCommandLineArgs() {
    return yargs(hideBin(process.argv))
        .option('host', {
            type: 'string',
            description: 'Minecraft server host',
            default: 'localhost',
        })
        .option('port', {
            type: 'number',
            description: 'Minecraft server port',
            default: 25565,
        })
        .option('username', {
            type: 'string',
            description: 'Bot username',
            default: 'LLMBot',
        })
        .help()
        .alias('help', 'h')
        .parseSync();
}

async function main() {
    let bot: mineflayer.Bot | undefined;
    try {
        const argv = parseCommandLineArgs();
        bot = createBot(argv);
        const server = createMcpServer(bot);

        process.stdin.on('end', () => {
            console.error('Claude has disconnected. Shutting down...');
            if (bot) {
                bot.quit();
            }
            process.exit(0);
        });

        const transport = createMcpServerTransport();
        await server.connect(transport);
        console.error('Minecraft MCP Server running on stdio');
    } catch (error) {
        console.error('Failed to start server:', error);
        if (bot) {bot.quit();}
        process.exit(1);
    }
}

main();
