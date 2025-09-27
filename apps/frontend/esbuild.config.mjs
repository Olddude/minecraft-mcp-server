import { cwd, env } from 'node:process';
import { join } from 'node:path';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';

import esbuild from 'esbuild';

/**
 * Creates the frontend 'dist' directory by removing any existing one,
 * and then creates a new one.
 */
function createDistDirectory() {
    const workDir = cwd();
    const frontendOutputDirectory = join(workDir, 'dist/frontend');
    rmSync(frontendOutputDirectory, { recursive: true, force: true });
    mkdirSync(frontendOutputDirectory, { recursive: true });
    console.debug('Prepared frontend dist directory:', frontendOutputDirectory);
}

/**
 * Publish the package.json file for the frontend.
 */
function publishPackageJson() {
    const workDir = cwd();
    const frontendOutputDirectory = join(workDir, 'dist/frontend');
    const packageJsonInputFile = join(workDir, 'package.json');

    console.debug('Package json input file', packageJsonInputFile);
    const packageJsonOutputText = readFileSync(packageJsonInputFile, { encoding: 'utf-8' });
    const packageJsonOutput = JSON.parse(packageJsonOutputText);

    // Create frontend package.json
    const frontendPackageJson = {
        ...packageJsonOutput,
        name: `${packageJsonOutput.name}-frontend`,
        main: 'index.js',
        bin: {
            'minecraft-mcp-frontend': 'index.js',
        },
        devDependencies: undefined,
        scripts: undefined,
        type: 'commonjs',
    };

    const frontendPackageJsonFile = join(frontendOutputDirectory, 'package.json');
    writeFileSync(frontendPackageJsonFile, JSON.stringify(frontendPackageJson, null, 2), { encoding: 'utf-8' });
    console.debug('Published frontend package.json to', frontendPackageJsonFile);
}

/**
 * Copies the types.d.ts file to the frontend 'dist' directory.
 */
function copyTypes() {
    const workDir = cwd();
    const frontendOutputDirectory = join(workDir, 'dist/frontend');

    copyFileSync(join(workDir, 'types.d.ts'), join(frontendOutputDirectory, 'types.d.ts'));
    console.debug('Copied types to frontend directory');
}


/**
 * Copies the README.md file to the frontend 'dist' directory.
 */
function copyReadme() {
    const workDir = cwd();
    const frontendOutputDirectory = join(workDir, 'dist/frontend');

    copyFileSync(join(workDir, 'README.md'), join(frontendOutputDirectory, 'README.md'));
    console.debug('Copied README.md to frontend directory');
}

/**
 * Copies the LICENSE file to the frontend 'dist' directory.
 */
function copyLicense() {
    const workDir = cwd();
    const frontendOutputDirectory = join(workDir, 'dist/frontend');

    copyFileSync(join(workDir, 'LICENSE'), join(frontendOutputDirectory, 'LICENSE'));
    console.debug('Copied LICENSE to frontend directory');
}

/**
 * Build the frontend application using esbuild.
 */
function buildApplication() {
    const workingDirectory = cwd();
    const frontendOutputDirectory = join(workingDirectory, 'dist/frontend');

    esbuild.build({
        entryPoints: ['src/frontend/index.ts'],
        bundle: true,
        platform: 'node',
        target: 'node20',
        format: 'cjs',
        outdir: frontendOutputDirectory,
        minify: true,
        sourcemap: env.NODE_ENV !== 'production',
        sourceRoot: workingDirectory,
        treeShaking: true,
        splitting: false, // only works with esm
        legalComments: 'none',
        logLevel: 'info',
        metafile: true,
        tsconfig: 'src/frontend/tsconfig.app.json',
        plugins: [{
            name: 'typescript-paths',
            setup(buildContext) {
                function resolveWithExtension(fullPath) {
                    // Try different extensions
                    for (const ext of ['.ts', '.js', '/index.ts', '/index.js']) {
                        const pathWithExt = fullPath + ext;
                        if (existsSync(pathWithExt)) {
                            return pathWithExt;
                        }
                    }
                    return null;
                }

                // Handle path mapping for @/src/* -> ./src/*
                buildContext.onResolve({ filter: /^@\/src\/.*/ }, (args) => {
                    const path = args.path.replace(/^@\/src\//, './src/');
                    const fullPath = join(workingDirectory, path);
                    const resolvedPath = resolveWithExtension(fullPath);
                    return resolvedPath ? { path: resolvedPath } : undefined;
                });
            },
        }],
    });
}

/**
 * Entry function to build the frontend application.
 */
function build() {
    createDistDirectory();
    publishPackageJson();
    copyTypes();
    copyReadme();
    copyLicense();
    buildApplication();
}

build();
