import { createConfig } from '@/src/server/config';
import { runApplication } from '@/src/server/app';

async function main() {
    const config = createConfig();
    await runApplication(config);
}

main();
