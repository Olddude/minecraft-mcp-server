import mineflayer from 'mineflayer';
import minecraftData from 'minecraft-data';
import { pathfinder, Movements } from 'mineflayer-pathfinder';

export function createBot(argv: { host: string, port: number, username: string }): mineflayer.Bot {
    const botOptions = {
        host: argv.host,
        port: argv.port,
        username: argv.username,
        plugins: { pathfinder },
    };

    console.error(`Connecting to Minecraft server at ${argv.host}:${argv.port} as ${argv.username}`);

    const bot = mineflayer.createBot(botOptions);

    bot.once('spawn', () => {
        console.error('Bot has spawned in the world');
        const mcData = minecraftData(bot.version);
        const defaultMove = new Movements(bot, mcData);
        bot.pathfinder.setMovements(defaultMove);
        bot.chat('Ai powered bot ready to receive instructions!');
    });

    bot.on('chat', (username, message) => {
        if (username === bot.username) {return;}
        console.error(`[CHAT] ${username}: ${message}`);
    });

    bot.on('kicked', (reason) => {
        console.error(`Bot was kicked: ${reason}`);
    });

    bot.on('error', (err) => {
        console.error(`Bot error: ${err.message}`);
    });

    return bot;
}
