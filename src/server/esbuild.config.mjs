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
 * Creates the server 'dist' directory by removing any existing one,
 * and then creates a new one.
 */
function createDistDirectory() {
    const serverOutputDirectory = join(workDir, 'dist/server');
    rmSync(serverOutputDirectory, { recursive: true, force: true });
    mkdirSync(serverOutputDirectory, { recursive: true });
    console.debug('Prepared server dist directory:', serverOutputDirectory);
}

/**
 * Publish the package.json file for the server.
 */
function publishPackageJson() {
    const serverOutputDirectory = join(workDir, 'dist/server');
    const packageJsonInputFile = join(workDir, 'package.json');

    console.debug('Package json input file', packageJsonInputFile);
    const packageJsonOutputText = readFileSync(packageJsonInputFile, { encoding: 'utf-8' });
    const packageJsonOutput = JSON.parse(packageJsonOutputText);

    // Create server package.json
    const serverPackageJson = {
        ...packageJsonOutput,
        name: `${packageJsonOutput.name}-server`,
        main: 'index.js',
        bin: {
            'minecraft-mcp-server': 'index.js',
        },
        devDependencies: undefined,
        scripts: undefined,
        type: 'commonjs',
    };

    const serverPackageJsonFile = join(serverOutputDirectory, 'package.json');
    writeFileSync(serverPackageJsonFile, JSON.stringify(serverPackageJson, null, 2), { encoding: 'utf-8' });
    console.debug('Published server package.json to', serverPackageJsonFile);
}

/**
 * Copies the types.d.ts file to the server 'dist' directory.
 */
function copyTypes() {
    const serverOutputDirectory = join(workDir, 'dist/server');

    copyFileSync(join(workDir, 'types.d.ts'), join(serverOutputDirectory, 'types.d.ts'));
    console.debug('Copied types to server directory');
}

/**
 * Copies the docs directory to the server 'dist' directory.
 */
function copyDocs() {
    const serverDocsDir = join(workDir, 'dist/server/docs');
    const srcDir = join(currentDir, 'docs');

    mkdirSync(serverDocsDir, { recursive: true });
    cpSync(srcDir, serverDocsDir, { recursive: true, dereference: true });
    console.debug('Copied docs to server directory');
}

/**
 * Copies the README.md file to the server 'dist' directory.
 */
function copyReadme() {
    const serverOutputDirectory = join(workDir, 'dist/server');

    copyFileSync(join(workDir, 'README.md'), join(serverOutputDirectory, 'README.md'));
    console.debug('Copied README.md to server directory');
}

/**
 * Copies the LICENSE file to the server 'dist' directory.
 */
function copyLicense() {
    const serverOutputDirectory = join(workDir, 'dist/server');

    copyFileSync(join(workDir, 'LICENSE'), join(serverOutputDirectory, 'LICENSE'));
    console.debug('Copied LICENSE to server directory');
}

/**
 * Copies the openapi.json file to the server 'dist' directory.
 */
function copyOpenApiSpec() {
    const serverOutputDirectory = join(workDir, 'dist/server');
    const openApiSource = join(currentDir, 'openapi.json');
    const openApiDest = join(serverOutputDirectory, 'openapi.json');

    copyFileSync(openApiSource, openApiDest);
    console.debug('Copied openapi.json to server directory');
}

/**
 * Build the server application using esbuild.
 */
function buildApplication() {
    const serverOutputDirectory = join(workDir, 'dist/server');

    esbuild.build({
        entryPoints: ['src/server/index.ts'],
        bundle: true,
        platform: 'node',
        target: 'node20',
        format: 'cjs',
        outdir: serverOutputDirectory,
        minify: true,
        sourcemap: env.NODE_ENV !== 'production',
        sourceRoot: workDir,
        treeShaking: true,
        splitting: false, // only works with esm
        legalComments: 'none',
        logLevel: 'info',
        metafile: true,
        tsconfig: 'src/server/tsconfig.app.json',
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
 * Entry function to build the server application.
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
