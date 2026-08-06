/**
 * Primordium demo entry point.
 *
 * Bootstraps the engine, provides a Three.js renderer/scene (but not its default
 * perspective render system — the scene renders itself with an orthographic
 * isometric camera), and mounts the ecosystem view. The world runs its fixed step
 * at the sim's timestep so the simulation advances in real time.
 */
import { World, installDefaults } from '@pulse-ts/core';
import { ThreeService } from '@pulse-ts/three';
import { PrimordiumScene } from './scene';
import { DEFAULT_CONFIG } from './sim/types';

const app = document.getElementById('app');
if (!app) throw new Error('Missing #app container');

const canvas = document.createElement('canvas');
canvas.style.cssText = 'width:100%;height:100%;display:block';
app.appendChild(canvas);

const world = new World({ fixedStepMs: DEFAULT_CONFIG.dt * 1000 });
installDefaults(world);
world.provideService(new ThreeService({ canvas, clearColor: 0x05070a }));
world.mount(PrimordiumScene);
world.start();
