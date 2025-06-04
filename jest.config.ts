import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    clearMocks: true,
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testMatch: [
        '<rootDir>/tests/**/*.spec.ts',
    ],
    testPathIgnorePatterns: [
        '<rootDir>/dist/',
        '<rootDir>/coverage/',
        '<rootDir>/integration/',
        '<rootDir>/node_modules/',
    ],
    coverageReporters: ['lcov', 'text', 'html', 'cobertura'],
    reporters: [
        'default',
        [ 'jest-junit', {
            outputDirectory: './',
            outputName: 'test-results.xml',
        }],
    ],
    moduleNameMapper: pathsToModuleNameMapper(
        { '@/src/*': ['src/*'] },
        { prefix: '<rootDir>/' },
    ),
};

export default config;
