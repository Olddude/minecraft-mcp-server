import { createConfig } from '@/src/shared/config';
import { runAsClient } from '@/src/client/app';

/**
 * Client application entry point.
 */
async function main() {
    const config = createConfig();
    await runAsClient(config);
}

// Only run if this file is executed directly
if (require.main === module) {
    main().catch((error) => {
        // Use console.error for startup failures since logging may not be initialized yet
        // eslint-disable-next-line no-console
        console.error('Client startup failed:', error);
        process.exit(1);
    });
}

export { runAsClient } from '@/src/client/app';
export * from '@/src/client/transport';
export * from '@/src/shared/config';
export * from '@/src/shared/logging';
