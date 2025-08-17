import { env } from 'node:process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync, cpSync, existsSync } from 'node:fs';

import esbuild from 'esbuild';

// Get the directory path for this ES module
const filename = fileURLToPath(import.meta.url);
const currentDir = dirname(filename);
const workDir = join(currentDir, '../..');

/**
 * Creates the backend 'dist' directory by removing any existing one,
 * and then creates a new one.
 */
function createDistDirectory() {
    const backendOutputDirectory = join(workDir, 'dist/backend');
    rmSync(backendOutputDirectory, { recursive: true, force: true });
    mkdirSync(backendOutputDirectory, { recursive: true });
    console.debug('Prepared backend dist directory:', backendOutputDirectory);
}

/**
 * Publish the package.json file for the backend.
 */
function publishPackageJson() {
    const backendOutputDirectory = join(workDir, 'dist/backend');
    const packageJsonInputFile = join(workDir, 'package.json');

    console.debug('Package json input file', packageJsonInputFile);
    const packageJsonOutputText = readFileSync(packageJsonInputFile, { encoding: 'utf-8' });
    const packageJsonOutput = JSON.parse(packageJsonOutputText);

    // Create backend package.json
    const backendPackageJson = {
        ...packageJsonOutput,
        name: `${packageJsonOutput.name}-backend`,
        main: 'index.js',
        bin: {
            'minecraft-mcp-backend': 'index.js',
        },
        devDependencies: undefined,
        scripts: undefined,
        type: 'commonjs',
    };

    const backendPackageJsonFile = join(backendOutputDirectory, 'package.json');
    writeFileSync(backendPackageJsonFile, JSON.stringify(backendPackageJson, null, 2), { encoding: 'utf-8' });
    console.debug('Published backend package.json to', backendPackageJsonFile);
}

/**
 * Copies the types.d.ts file to the backend 'dist' directory.
 */
function copyTypes() {
    const backendOutputDirectory = join(workDir, 'dist/backend');

    copyFileSync(join(workDir, 'types.d.ts'), join(backendOutputDirectory, 'types.d.ts'));
    console.debug('Copied types to backend directory');
}

/**
 * Copies the docs directory to the backend 'dist' directory.
 */
function copyDocs() {
    const backendDocsDir = join(workDir, 'dist/backend/docs');
    const srcDir = join(currentDir, 'docs');

    mkdirSync(backendDocsDir, { recursive: true });
    cpSync(srcDir, backendDocsDir, { recursive: true, dereference: true });
    console.debug('Copied docs to backend directory');
}

/**
 * Copies the README.md file to the backend 'dist' directory.
 */
function copyReadme() {
    const backendOutputDirectory = join(workDir, 'dist/backend');

    copyFileSync(join(workDir, 'README.md'), join(backendOutputDirectory, 'README.md'));
    console.debug('Copied README.md to backend directory');
}

/**
 * Copies the LICENSE file to the backend 'dist' directory.
 */
function copyLicense() {
    const backendOutputDirectory = join(workDir, 'dist/backend');

    copyFileSync(join(workDir, 'LICENSE'), join(backendOutputDirectory, 'LICENSE'));
    console.debug('Copied LICENSE to backend directory');
}

/**
 * Copies the openapi.json file to the backend 'dist' directory.
 */
function copyOpenApiSpec() {
    const backendOutputDirectory = join(workDir, 'dist/backend');
    const openApiSource = join(currentDir, 'openapi.json');
    const openApiDest = join(backendOutputDirectory, 'openapi.json');

    copyFileSync(openApiSource, openApiDest);
    console.debug('Copied openapi.json to backend directory');
}

/**
 * Build the backend application using esbuild.
 */
function buildApplication() {
    const backendOutputDirectory = join(workDir, 'dist/backend');

    esbuild.build({
        entryPoints: ['src/backend/index.ts'],
        bundle: true,
        platform: 'node',
        target: 'node20',
        format: 'cjs',
        outdir: backendOutputDirectory,
        minify: true,
        sourcemap: env.NODE_ENV !== 'production',
        sourceRoot: workDir,
        treeShaking: true,
        splitting: false, // only works with esm
        legalComments: 'none',
        logLevel: 'info',
        metafile: true,
        tsconfig: 'src/backend/tsconfig.app.json',
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
                    const fullPath = join(workDir, path);
                    const resolvedPath = resolveWithExtension(fullPath);
                    return resolvedPath ? { path: resolvedPath } : undefined;
                });
            },
        }],
    });
}

/**
 * Entry function to build the backend application.
 */
function build() {
    createDistDirectory();
    publishPackageJson();
    copyTypes();
    copyDocs();
    copyReadme();
    copyLicense();
    copyOpenApiSpec();
    buildApplication();
}

build();
