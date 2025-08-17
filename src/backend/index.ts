import { createConfig } from '@/src/backend/config';
import { runApplication } from '@/src/backend/app';

async function main() {
    const config = createConfig();
    await runApplication(config);
}

main();
