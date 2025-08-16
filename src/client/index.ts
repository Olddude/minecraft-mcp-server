import { createConfig } from '@/shared/config';
import { runAsClient } from '@/client/client';

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

export { runAsClient } from '@/client/client';
export * from '@/shared/transport/client';
export * from '@/shared/config';
export * from '@/shared/logging';
