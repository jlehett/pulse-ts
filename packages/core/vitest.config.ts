import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/**/*.bench.test.ts'],
        environment: 'node',
        benchmark: {
            include: ['src/**/*.bench.test.ts'],
        },
    },
});
