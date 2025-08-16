import { createConfig } from '@/src/shared/config';
import { runAsClient } from '@/src/client';
import { runAsServer } from '@/src/server';

/**
 * Application entry point.
 * Chooses between client and server mode based on configuration.
 */
async function main() {
    const config = createConfig();
    if (config.client) {
        await runAsClient(config);
    } else {
        await runAsServer(config);
    }
}

// Only run if this file is executed directly
if (require.main === module) {
    main().catch((error) => {
        // Use console.error for startup failures since logging may not be initialized yet
        // eslint-disable-next-line no-console
        console.error('Application startup failed:', error);
        process.exit(1);
    });
}
