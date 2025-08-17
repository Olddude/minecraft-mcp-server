import { createConfig } from '@/src/client/config';
import { runApplication } from '@/src/client/app';

async function main() {
    const config = createConfig();
    await runApplication(config);
}

main();
