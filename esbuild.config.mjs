import { cwd, env } from 'node:process';
import { join } from 'node:path';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

import esbuild from 'esbuild';


function prepareDistDirectory() {
    const workDir = cwd();
    const serverOutputDirectory = join(workDir, 'dist');
    rmSync(serverOutputDirectory, { recursive: true, force: true });
    mkdirSync(serverOutputDirectory, { recursive: true });
    const packageJsonOutputFile = join(serverOutputDirectory, 'package.json');
    console.debug('Package json output file', packageJsonOutputFile);
    copyFileSync('package.json', packageJsonOutputFile);
    const packageJsonOutputText = readFileSync(packageJsonOutputFile, { encoding: 'utf-8' });
    const packageJsonOutput = JSON.parse(packageJsonOutputText);
    delete packageJsonOutput.devDependencies;
    delete packageJsonOutput.scripts;
    const cjsPackageJson = {
        ...packageJsonOutput,
        type: 'commonjs',
    };
    const cjsPackageJsonText = JSON.stringify(cjsPackageJson, null, 2);
    writeFileSync(packageJsonOutputFile, cjsPackageJsonText, { encoding: 'utf-8' });
}

function buildServer() {
    const workDir = cwd();
    const serverOutputDirectory = join(workDir, 'dist');
    esbuild.build({
        entryPoints: [
            'src/bot.ts'
        ],
        bundle: false,
        platform: 'node',
        target: 'node20',
        format: 'cjs',
        outdir: serverOutputDirectory,
        minify: true,
        sourcemap: env.NODE_ENV === 'development',
        sourceRoot: workDir,
        treeShaking: true,
        splitting: false, // only works with esm
        legalComments: 'none',
        logLevel: 'info',
        metafile: true,
        tsconfig: 'tsconfig.json',
    });
}

function build() {
    prepareDistDirectory();
    buildServer();
}

build();
