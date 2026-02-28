import { World, installDefaults } from '@pulse-ts/core';
import { installAudio } from '@pulse-ts/audio';
import { installInput } from '@pulse-ts/input';
import { installPhysics } from '@pulse-ts/physics';
import { installSave } from '@pulse-ts/save';
import { installThree, StatsOverlaySystem } from '@pulse-ts/three';
import {
    installNetwork,
    createMemoryHub,
    type MemoryHub,
} from '@pulse-ts/network';
import { ArenaNode, type ArenaNodeProps } from './nodes/ArenaNode';
import { p1Bindings, p2Bindings } from './config/bindings';

const params = new URLSearchParams(location.search);
const mode = params.get('mode'); // 'ws' for WebSocket, null for split-screen
const playerParam = params.get('player'); // 'p1' or 'p2' (WebSocket mode only)

/** Default WebSocket relay URL when running in WS mode. */
const WS_URL = 'ws://localhost:8080';

async function createPlayerWorld(
    canvas: HTMLCanvasElement,
    bindings: typeof p1Bindings,
    playerId: number,
    arenaProps: Omit<ArenaNodeProps, 'playerId'>,
) {
    const world = new World();

    installDefaults(world);
    installSave(world);
    installAudio(world);
    installInput(world, { preventDefault: true, bindings });
    installPhysics(world, { gravity: { x: 0, y: -20, z: 0 } });
    await installNetwork(world);

    const three = installThree(world, {
        canvas,
        clearColor: 0x0a0e1e,
    });

    three.renderer.shadowMap.enabled = true;
    three.renderer.shadowMap.type = 1; // THREE.PCFShadowMap

    world.addSystem(
        new StatsOverlaySystem({
            position: playerId === 0 ? 'top-left' : 'top-right',
        }),
    );

    world.mount(ArenaNode, { playerId, ...arenaProps });

    return world;
}

/**
 * Split-screen mode (default): two canvases, two worlds, in-memory hub.
 */
async function startSplitScreen() {
    const p1Canvas = document.getElementById('p1') as HTMLCanvasElement;
    const p2Canvas = document.getElementById('p2') as HTMLCanvasElement;
    const hub: MemoryHub = createMemoryHub();

    const world1 = await createPlayerWorld(p1Canvas, p1Bindings, 0, { hub });
    const world2 = await createPlayerWorld(p2Canvas, p2Bindings, 1, { hub });

    world1.start();
    world2.start();
}

/**
 * WebSocket mode: single canvas, one world, relay server transport.
 * URL params: `?mode=ws&player=p1` or `?mode=ws&player=p2`.
 */
async function startWebSocket() {
    const canvas = document.getElementById('solo') as HTMLCanvasElement;
    const playerId = playerParam === 'p2' ? 1 : 0;
    const bindings = playerId === 0 ? p1Bindings : p2Bindings;

    const world = await createPlayerWorld(canvas, bindings, playerId, {
        wsUrl: WS_URL,
    });

    world.start();
}

if (mode === 'ws') {
    startWebSocket();
} else {
    startSplitScreen();
}
