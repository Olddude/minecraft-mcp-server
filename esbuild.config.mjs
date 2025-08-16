import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { cwd } from 'node:process';

/**
 * Entry function to build both client and server applications.
 * Runs the individual build configs in each directory.
 */
function build() {
    console.log('Building client and server applications...');

    const workDir = cwd();

    try {
        // Build client
        console.log('Building client...');
        execSync('node esbuild.config.mjs', {
            cwd: join(workDir, 'src', 'client'),
            stdio: 'inherit',
        });

        // Build server
        console.log('Building server...');
        execSync('node esbuild.config.mjs', {
            cwd: join(workDir, 'src', 'server'),
            stdio: 'inherit',
        });

        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error.message);
        process.exit(1);
    }
}

build();
