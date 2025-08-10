export default {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true }],
    },
    testPathIgnorePatterns: [
        '<rootDir>/*/node_modules/',
        '<rootDir>/*/dist/',
        '<rootDir>/packages/.*/dist/',
        '<rootDir>/packages/.*/node_modules/',
    ],
    watchman: false,
};
