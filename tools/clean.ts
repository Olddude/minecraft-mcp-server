import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

/**
 * Clean project directories and files
 */
async function clean(): Promise<void> {
    const dirsToRemove = [
        'coverage',
        'dist',
        'logs',
        'modules',
        'node_modules',
    ];

    const filesToRemove = [
        '.env',
        'test-results.xml',
    ];

    console.log('Cleaning project directories...');

    // Remove directories
    for (const dir of dirsToRemove) {
        const dirPath = join(cwd(), dir);
        try {
            await fs.rm(dirPath, { recursive: true, force: true });
            console.log(`Removed ${dir}`);
        } catch {
            // Directory doesn't exist or already removed
            console.log(`${dir} not found or already clean`);
        }
    }

    // Remove files
    for (const file of filesToRemove) {
        const filePath = join(cwd(), file);
        try {
            await fs.unlink(filePath);
            console.log(`Removed ${file}`);
        } catch {
            // File doesn't exist or already removed
            console.log(`${file} not found or already clean`);
        }
    }

    console.log('Clean complete!');
}

// Execute if this is the main module
if (require.main === module) {
    clean().catch(error => {
        console.error('Error during clean:', error);
        process.exit(1);
    });
}

export { clean };
