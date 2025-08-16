import { createConfig } from './config';
import { runAsClient } from '@/src/client/app';

/**
 * Client application entry point.
 */
async function main() {
    const config = createConfig();
    await runAsClient(config);
}

main();
