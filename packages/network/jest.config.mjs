import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '^@pulse-ts/core$': '<rootDir>/../core/src/index.ts',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transform: {
        '^.+\\.(ts|tsx|js|jsx)$': [
            'babel-jest',
            { configFile: resolve(__dirname, 'babel.config.cjs') },
        ],
    },
    setupFiles: ['<rootDir>/setupTests.ts'],
    testMatch: ['**/*.test.ts', '**/*.test.tsx'],
    testPathIgnorePatterns: ['<rootDir>/*/node_modules/', '<rootDir>/*/dist/'],
    watchman: false,
};
