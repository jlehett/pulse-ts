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
import { initLandscapeEnforcer } from './landscapeEnforcer';
import { initAutoFullscreen } from './autoFullscreen';
import { showInstallPrompt } from './installPrompt';
import { setupPostProcessing } from './setupPostProcessing';

const canvas = document.getElementById('arena') as HTMLCanvasElement;
const container = canvas.parentElement ?? document.body;

initLandscapeEnforcer();
initAutoFullscreen();
showInstallPrompt();

function startLocalGame(): Promise<void> {
    return new Promise((resolve) => {
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
        const shockwavePass = setupPostProcessing(three);

        world.addSystem(new StatsOverlaySystem({ position: 'top-left' }));

        world.mount(ArenaNode, {
            shockwavePass,
            onRequestMenu: () => {
                three.renderer.clear();
                world.destroy();
                resolve();
            },
        });

        world.start();
    });
}

async function startOnlineGame(lobby: LobbyResult): Promise<void> {
    return new Promise((resolve) => {
        const setup = async () => {
            const world = new World();

            installDefaults(world);
            installAudio(world);
            installInput(world, {
                preventDefault: true,
                bindings: allBindings,
            });
            installPhysics(world, { gravity: { x: 0, y: -20, z: 0 } });

            const three = installThree(world, {
                canvas,
                clearColor: 0x0a0a1a,
            });

            await installNetwork(world, {
                replication: { sendHz: 60 },
            });

            three.renderer.shadowMap.enabled = true;
            three.renderer.shadowMap.type = 1; // THREE.PCFShadowMap
            const shockwavePass = setupPostProcessing(three);

            world.addSystem(new StatsOverlaySystem({ position: 'top-left' }));

            world.mount(ArenaNode, {
                playerId: lobby.playerId,
                wsUrl: lobby.wsUrl,
                isHost: lobby.mode === 'host',
                shockwavePass,
                onRequestMenu: () => {
                    three.renderer.clear();
                    world.destroy();
                    resolve();
                },
            });

            world.start();
        };
        setup();
    });
}

async function start() {
    const choice = await showMainMenu(container);

    if (choice === 'local') {
        await startLocalGame();
    } else {
        const lobby = await showLobby(container);
        if (lobby === 'back') {
            // Fall through to restart
        } else {
            await startOnlineGame(lobby);
        }
    }

    // Loop back to main menu
    start();
}

start();
