export default {
    // Node environment is sufficient for core; avoids jsdom + punycode warnings
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transform: {
        '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest'],
    },
    testMatch: ['**/*.test.ts', '**/*.test.tsx'],
    testPathIgnorePatterns: [
        '<rootDir>/*/node_modules/',
        '<rootDir>/*/dist/',
        '\\.bench\\.test\\.ts$',
    ],
    watchman: false,
};
