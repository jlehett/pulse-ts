import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ESM context
const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    resolve: {
        // Point @pulse-ts/core at source so benches run without a prior build step.
        alias: {
            '@pulse-ts/core': resolve(__dirname, '../core/src/index.ts'),
        },
    },
    test: {
        include: ['src/**/*.bench.ts'],
        environment: 'node',
    },
});
