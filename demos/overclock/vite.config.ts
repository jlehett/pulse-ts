import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: '.',
    base: '/demos/overclock/',
    server: {
        open: true,
        host: true,
    },
    resolve: {
        alias: {
            '@pulse-ts/core': path.resolve(
                __dirname,
                '../../packages/core/src',
            ),
            '@pulse-ts/input': path.resolve(
                __dirname,
                '../../packages/input/src',
            ),
            '@pulse-ts/three': path.resolve(
                __dirname,
                '../../packages/three/src',
            ),
            '@pulse-ts/effects': path.resolve(
                __dirname,
                '../../packages/effects/src',
            ),
            '@pulse-ts/audio': path.resolve(
                __dirname,
                '../../packages/audio/src',
            ),
            '@pulse-ts/dom/jsx-dev-runtime': path.resolve(
                __dirname,
                '../../packages/dom/src/jsx-dev-runtime',
            ),
            '@pulse-ts/dom/jsx-runtime': path.resolve(
                __dirname,
                '../../packages/dom/src/jsx-runtime',
            ),
            '@pulse-ts/dom': path.resolve(__dirname, '../../packages/dom/src'),
        },
    },
});
