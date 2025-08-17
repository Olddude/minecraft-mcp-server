import { createConfig } from '@/src/server/config';
import { runAsServer } from '@/src/server/app';

/**
 * Server application entry point.
 */
async function main() {
    const config = createConfig();
    await runAsServer(config);
}

main();
