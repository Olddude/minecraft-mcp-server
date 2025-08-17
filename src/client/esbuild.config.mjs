import { cwd, env } from 'node:process';
import { join } from 'node:path';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync, cpSync, existsSync } from 'node:fs';

import esbuild from 'esbuild';

/**
 * Creates the client 'dist' directory by removing any existing one,
 * and then creates a new one.
 */
function createDistDirectory() {
    const workDir = cwd();
    const clientOutputDirectory = join(workDir, 'dist/client');
    rmSync(clientOutputDirectory, { recursive: true, force: true });
    mkdirSync(clientOutputDirectory, { recursive: true });
    console.debug('Prepared client dist directory:', clientOutputDirectory);
}

/**
 * Publish the package.json file for the client.
 */
function publishPackageJson() {
    const workDir = cwd();
    const clientOutputDirectory = join(workDir, 'dist/client');
    const packageJsonInputFile = join(workDir, 'package.json');

    console.debug('Package json input file', packageJsonInputFile);
    const packageJsonOutputText = readFileSync(packageJsonInputFile, { encoding: 'utf-8' });
    const packageJsonOutput = JSON.parse(packageJsonOutputText);

    // Create client package.json
    const clientPackageJson = {
        ...packageJsonOutput,
        name: `${packageJsonOutput.name}-client`,
        main: 'index.js',
        bin: {
            'minecraft-mcp-client': 'index.js',
        },
        devDependencies: undefined,
        scripts: undefined,
        type: 'commonjs',
    };

    const clientPackageJsonFile = join(clientOutputDirectory, 'package.json');
    writeFileSync(clientPackageJsonFile, JSON.stringify(clientPackageJson, null, 2), { encoding: 'utf-8' });
    console.debug('Published client package.json to', clientPackageJsonFile);
}

/**
 * Copies the types.d.ts file to the client 'dist' directory.
 */
function copyTypes() {
    const workDir = cwd();
    const clientOutputDirectory = join(workDir, 'dist/client');

    copyFileSync(join(workDir, 'types.d.ts'), join(clientOutputDirectory, 'types.d.ts'));
    console.debug('Copied types to client directory');
}

/**
 * Copies the docs directory to the client 'dist' directory.
 */
function copyDocs() {
    const workDir = cwd();
    const clientDocsDir = join(workDir, 'dist/client/docs');
    const srcDir = join(workDir, 'docs');

    mkdirSync(clientDocsDir, { recursive: true });
    cpSync(srcDir, clientDocsDir, { recursive: true, dereference: true });
    console.debug('Copied docs to client directory');
}

/**
 * Copies the README.md file to the client 'dist' directory.
 */
function copyReadme() {
    const workDir = cwd();
    const clientOutputDirectory = join(workDir, 'dist/client');

    copyFileSync(join(workDir, 'README.md'), join(clientOutputDirectory, 'README.md'));
    console.debug('Copied README.md to client directory');
}

/**
 * Copies the LICENSE file to the client 'dist' directory.
 */
function copyLicense() {
    const workDir = cwd();
    const clientOutputDirectory = join(workDir, 'dist/client');

    copyFileSync(join(workDir, 'LICENSE'), join(clientOutputDirectory, 'LICENSE'));
    console.debug('Copied LICENSE to client directory');
}

/**
 * Build the client application using esbuild.
 */
function buildApplication() {
    const workingDirectory = cwd();
    const clientOutputDirectory = join(workingDirectory, 'dist/client');

    esbuild.build({
        entryPoints: ['src/client/index.ts'],
        bundle: true,
        platform: 'node',
        target: 'node20',
        format: 'cjs',
        outdir: clientOutputDirectory,
        minify: true,
        sourcemap: env.NODE_ENV !== 'production',
        sourceRoot: workingDirectory,
        treeShaking: true,
        splitting: false, // only works with esm
        legalComments: 'none',
        logLevel: 'info',
        metafile: true,
        tsconfig: 'src/client/tsconfig.app.json',
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
 * Entry function to build the client application.
 */
function build() {
    createDistDirectory();
    publishPackageJson();
    copyTypes();
    copyDocs();
    copyReadme();
    copyLicense();
    buildApplication();
}

build();
