import { createConfig } from './config';
import { runApplication } from './app';

async function main() {
    const config = createConfig();
    await runApplication(config);
}

main();
