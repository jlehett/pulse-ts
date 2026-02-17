import { World, installDefaults } from '@pulse-ts/core';
import { installInput } from '@pulse-ts/input';
import { installPhysics } from '@pulse-ts/physics';
import { installThree } from '@pulse-ts/three';
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

// Enable shadows on the renderer
three.renderer.shadowMap.enabled = true;
three.renderer.shadowMap.type = 2; // THREE.PCFSoftShadowMap

world.mount(LevelNode);
world.start();
