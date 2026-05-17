import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { lumenwakeRelayPlugin } from './vite-plugin-relay';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: '.',
    base: '/demos/lumenwake/',
    plugins: [lumenwakeRelayPlugin()],
    define: {
        'window.__SIGNALING_URL__': process.env.VITE_SIGNALING_URL
            ? JSON.stringify(process.env.VITE_SIGNALING_URL)
            : 'undefined',
        '__APP_VERSION__': JSON.stringify(
            process.env.VITE_APP_VERSION || 'dev',
        ),
    },
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
            '@pulse-ts/physics': path.resolve(
                __dirname,
                '../../packages/physics/src',
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
            '@pulse-ts/network': path.resolve(
                __dirname,
                '../../packages/network/src',
            ),
            '@pulse-ts/save': path.resolve(
                __dirname,
                '../../packages/save/src',
            ),
            '@pulse-ts/dom/jsx-dev-runtime': path.resolve(
                __dirname,
                '../../packages/dom/src/jsx-dev-runtime',
            ),
            '@pulse-ts/dom/jsx-runtime': path.resolve(
                __dirname,
                '../../packages/dom/src/jsx-runtime',
            ),
            '@pulse-ts/dom': path.resolve(
                __dirname,
                '../../packages/dom/src',
            ),
            '@pulse-ts/platform': path.resolve(
                __dirname,
                '../../packages/platform/src',
            ),
        },
    },
});
