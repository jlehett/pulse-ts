export default {
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': ['babel-jest', {
            presets: [
                ['@babel/preset-env', { targets: { node: 'current' } }],
                '@babel/preset-typescript',
            ],
        }],
    },
    testMatch: ['**/src/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
};
