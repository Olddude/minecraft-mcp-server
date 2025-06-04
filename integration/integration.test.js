import { describe, it, beforeEach, afterEach } from 'node:test';
import { strictEqual } from 'node:assert';
import { cwd, env } from 'node:process';
import { execSync } from 'node:child_process';

describe('Integration', () => {
    beforeEach(() => {
        process.env.NODE_ENV = 'test';
    });

    it('should succeed', () => {
        const serverArgs = '-r dotenv/config -r ts-node/register ./index.ts';
        const serverOutput = execSync(`node ${serverArgs}`, {
            stdio: 'pipe',
            encoding: 'utf8',
            env: { ...env },
            cwd: cwd(),
        });

        const clientArgs = `${serverArgs} --client`;
        const clientOutput = execSync(`node ${clientArgs}`, {
            stdio: 'pipe',
            encoding: 'utf8',
            env: { ...env },
            cwd: cwd(),
        });

        strictEqual(clientOutput, serverOutput);
    });

    afterEach(() => {
        delete process.env.NODE_ENV;
    });
});
