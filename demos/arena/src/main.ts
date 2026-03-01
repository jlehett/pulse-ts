import { World, installDefaults } from '@pulse-ts/core';
import { installAudio } from '@pulse-ts/audio';
import { installInput } from '@pulse-ts/input';
import { installPhysics } from '@pulse-ts/physics';
import { installThree, StatsOverlaySystem } from '@pulse-ts/three';
import { installSave } from '@pulse-ts/save';
import { ArenaNode } from './nodes/ArenaNode';
import { allBindings } from './config/bindings';
import { showMainMenu } from './menu';
import { showLobby } from './lobby';

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

    installSave(world, { plugins: ['@pulse-ts/three'] });

    three.renderer.shadowMap.enabled = true;
    three.renderer.shadowMap.type = 1; // THREE.PCFShadowMap

    world.addSystem(new StatsOverlaySystem({ position: 'top-left' }));

    world.mount(ArenaNode);

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
            // Online game — TICKET-060 will implement startOnlineGame(lobby)
            start();
        }
    }
}

start();
