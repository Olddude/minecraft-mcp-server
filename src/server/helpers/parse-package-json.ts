import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Parses the package.json file to extract application metadata.
 * @returns Parsed package.json content.
 */
export function parsePackageJson() {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson;
}
