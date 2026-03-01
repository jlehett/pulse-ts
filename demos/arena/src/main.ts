import { World, installDefaults } from '@pulse-ts/core';
import { installAudio } from '@pulse-ts/audio';
import { installInput } from '@pulse-ts/input';
import { installPhysics } from '@pulse-ts/physics';
import { installThree, StatsOverlaySystem } from '@pulse-ts/three';
import { installNetwork } from '@pulse-ts/network';
import { ArenaNode } from './nodes/ArenaNode';
import { allBindings } from './config/bindings';
import { showMainMenu } from './menu';
import { showLobby, type LobbyResult } from './lobby';

const canvas = document.getElementById('arena') as HTMLCanvasElement;
const container = canvas.parentElement ?? document.body;

function startLocalGame() {
    const world = new World();

    installDefaults(world);
    installAudio(world);
    installInput(world, { preventDefault: true, bindings: allBindings });
    installPhysics(world, { gravity: { x: 0, y: -20, z: 0 } });

    const three = installThree(world, {
        canvas,
        clearColor: 0x0a0a1a,
    });

    three.renderer.shadowMap.enabled = true;
    three.renderer.shadowMap.type = 1; // THREE.PCFShadowMap

    world.addSystem(new StatsOverlaySystem({ position: 'top-left' }));

    world.mount(ArenaNode);

    world.start();
}

async function startOnlineGame(lobby: LobbyResult) {
    const world = new World();

    installDefaults(world);
    installAudio(world);
    // Online mode: both players use WASD + Space (p1 bindings)
    installInput(world, { preventDefault: true, bindings: allBindings });
    installPhysics(world, { gravity: { x: 0, y: -20, z: 0 } });

    const three = installThree(world, {
        canvas,
        clearColor: 0x0a0a1a,
    });

    await installNetwork(world);

    three.renderer.shadowMap.enabled = true;
    three.renderer.shadowMap.type = 1; // THREE.PCFShadowMap

    world.addSystem(new StatsOverlaySystem({ position: 'top-left' }));

    world.mount(ArenaNode, {
        playerId: lobby.playerId,
        wsUrl: lobby.wsUrl,
    });

    world.start();
}

async function start() {
    const choice = await showMainMenu(container);

    if (choice === 'local') {
        startLocalGame();
    } else {
        const lobby = await showLobby(container);
        if (lobby === 'back') {
            start();
        } else {
            startOnlineGame(lobby);
        }
    }
}

start();
