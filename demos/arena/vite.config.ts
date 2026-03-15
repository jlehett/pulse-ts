import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { arenaRelayPlugin } from './vite-plugin-relay';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: '.',
    base: '/demos/arena/',
    plugins: [arenaRelayPlugin()],
    define: {
        // Inject signaling URL at build time for deployed frontend.
        // Set VITE_SIGNALING_URL env var before building (e.g., from Terraform output).
        // Falls back to undefined so the runtime fallback in lobby.ts kicks in.
        'window.__SIGNALING_URL__': process.env.VITE_SIGNALING_URL
            ? JSON.stringify(process.env.VITE_SIGNALING_URL)
            : 'undefined',
        // Inject app version at build time for version checking.
        // Set VITE_APP_VERSION env var before building (deploy.sh uses git SHA).
        // Falls back to 'dev' for local development.
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
