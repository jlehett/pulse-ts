import { World, installDefaults } from '@pulse-ts/core';
import { installInput } from '@pulse-ts/input';
import { installPhysics } from '@pulse-ts/physics';
import { installThree, StatsOverlaySystem } from '@pulse-ts/three';
import { bindings } from './config/bindings';
import { LevelNode } from './nodes/LevelNode';

const canvas = document.getElementById('game') as HTMLCanvasElement;

const world = new World();

installDefaults(world);
installInput(world, { preventDefault: true, bindings });
installPhysics(world, { gravity: { x: 0, y: -20, z: 0 } });

const three = installThree(world, {
    canvas,
    clearColor: 0x0a0a1a,
});

// Enable shadows on the renderer.
// PCFShadowMap (type 1) uses a single Poisson tap vs PCFSoftShadowMap's
// multi-tap kernel — visually similar at 1024 resolution, measurably cheaper.
three.renderer.shadowMap.enabled = true;
three.renderer.shadowMap.type = 1; // THREE.PCFShadowMap

world.addSystem(new StatsOverlaySystem({ position: 'top-left' }));

world.mount(LevelNode);
world.start();
