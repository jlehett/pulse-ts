export default {
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transform: {
        '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest'],
    },
    setupFiles: ['<rootDir>/setupTests.ts'],
    testMatch: ['**/*.test.ts', '**/*.test.tsx'],
    testPathIgnorePatterns: ['<rootDir>/*/node_modules/', '<rootDir>/*/dist/'],
    watchman: false,
};
