import { World, installDefaults } from '@pulse-ts/core';
import { installAudio } from '@pulse-ts/audio';
import { installInput } from '@pulse-ts/input';
import { installPhysics } from '@pulse-ts/physics';
import { installThree, StatsOverlaySystem } from '@pulse-ts/three';
import { createMemoryHub } from '@pulse-ts/network';
import { ArenaNode } from './nodes/ArenaNode';
import { p1Bindings, p2Bindings } from './config/bindings';

const p1Canvas = document.getElementById('p1') as HTMLCanvasElement;
const p2Canvas = document.getElementById('p2') as HTMLCanvasElement;

// Shared networking hub — both worlds communicate through this
const hub = createMemoryHub();

function createPlayerWorld(
    canvas: HTMLCanvasElement,
    bindings: typeof p1Bindings,
    playerId: number,
) {
    const world = new World();

    installDefaults(world);
    installAudio(world);
    installInput(world, { preventDefault: true, bindings });
    installPhysics(world, { gravity: { x: 0, y: -20, z: 0 } });

    const three = installThree(world, {
        canvas,
        clearColor: 0x0a0a1a,
    });

    three.renderer.shadowMap.enabled = true;
    three.renderer.shadowMap.type = 1; // THREE.PCFShadowMap

    world.addSystem(
        new StatsOverlaySystem({
            position: playerId === 0 ? 'top-left' : 'top-right',
        }),
    );

    world.mount(ArenaNode, { playerId });

    return world;
}

const world1 = createPlayerWorld(p1Canvas, p1Bindings, 0);
const world2 = createPlayerWorld(p2Canvas, p2Bindings, 1);

world1.start();
world2.start();
