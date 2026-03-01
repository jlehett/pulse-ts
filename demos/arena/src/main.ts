import { World, installDefaults } from '@pulse-ts/core';
import { installAudio } from '@pulse-ts/audio';
import { installInput } from '@pulse-ts/input';
import { installPhysics } from '@pulse-ts/physics';
import { installThree, StatsOverlaySystem } from '@pulse-ts/three';
import { ArenaNode } from './nodes/ArenaNode';
import { allBindings } from './config/bindings';

const canvas = document.getElementById('arena') as HTMLCanvasElement;

async function start() {
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

start();
