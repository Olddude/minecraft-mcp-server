import { createConfig } from '@/src/frontend/config';
import { runApplication } from '@/src/frontend/app';

async function main() {
    const config = createConfig();
    await runApplication(config);
}

main();
