import { createConfig } from '@/src/shared/config';
import { runAsServer } from '@/src/server/app';

/**
 * Server application entry point.
 */
async function main() {
    const config = createConfig();
    await runAsServer(config);
}

// Only run if this file is executed directly
if (require.main === module) {
    main().catch((error) => {
        // Use console.error for startup failures since logging may not be initialized yet
        // eslint-disable-next-line no-console
        console.error('Server startup failed:', error);
        process.exit(1);
    });
}

export { runAsServer } from '@/src/server/app';
export * from '@/src/server/prompts';
export * from '@/src/server/resources';
export * from '@/src/server/tools';
export * from '@/src/shared/transport/server';
export * from '@/src/shared/config';
export * from '@/src/shared/logging';
