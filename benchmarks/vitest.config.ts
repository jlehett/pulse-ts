import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    resolve: {
        /**
         * Resolve workspace packages from source so benchmarks run without a
         * prior build step. The benchmarks package is the canonical home for
         * cross-package aliases — individual packages should not need their own
         * alias workarounds for benchmark purposes.
         */
        alias: {
            '@pulse-ts/core': resolve(__dirname, '../packages/core/src/index.ts'),
            '@pulse-ts/physics': resolve(__dirname, '../packages/physics/src/index.ts'),
        },
    },
    test: {
        include: ['**/*.bench.test.ts'],
        environment: 'node',
        benchmark: {
            include: ['**/*.bench.test.ts'],
        },
    },
});
