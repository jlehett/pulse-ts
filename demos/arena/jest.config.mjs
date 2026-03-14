export default {
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transform: {
        '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', {
            presets: [
                ['@babel/preset-env', { targets: { node: 'current' }, modules: 'auto' }],
                '@babel/preset-typescript',
            ],
            plugins: [
                ['@babel/plugin-transform-react-jsx', { runtime: 'automatic', importSource: '@pulse-ts/dom' }],
            ],
        }],
    },
    moduleNameMapper: {
        '^@pulse-ts/dom$': '<rootDir>/../../packages/dom/src/index.ts',
        '^@pulse-ts/dom/jsx-runtime$': '<rootDir>/../../packages/dom/src/jsx-runtime/index.ts',
    },
    setupFiles: ['<rootDir>/setupTests.ts'],
    testMatch: ['**/*.test.ts', '**/*.test.tsx'],
    testPathIgnorePatterns: ['<rootDir>/*/node_modules/', '<rootDir>/*/dist/', '<rootDir>/infra/'],
    globals: {
        __APP_VERSION__: 'test-abc',
    },
    watchman: false,
};
