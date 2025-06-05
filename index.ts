import { createConfig } from './src/config';
import { runAsClient } from './src/client';
import { runAsServer } from './src/server';

/**
 * Application entry point.
 */
async function main() {
    const config = createConfig();
    if (config.client) {
        await runAsClient(config);
    } else {
        await runAsServer(config);
    }
}

main();
