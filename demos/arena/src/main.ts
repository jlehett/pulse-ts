import { World, installDefaults } from '@pulse-ts/core';
import { installAudio } from '@pulse-ts/audio';
import { installInput } from '@pulse-ts/input';
import { installPhysics } from '@pulse-ts/physics';
import { installThree, StatsOverlaySystem } from '@pulse-ts/three';
import { installNetwork } from '@pulse-ts/network';
import { ArenaNode } from './nodes/ArenaNode';
import { MenuSceneNode } from './nodes/MenuSceneNode';
import { allBindings } from './config/bindings';
import { showMainMenu } from './menu';
import { showLobby, type LobbyResult } from './lobby';
import { AI_PERSONALITIES, type AiPersonality } from './ai/personalities';
import { initLandscapeEnforcer } from './landscapeEnforcer';
import { initAutoFullscreen } from './autoFullscreen';
import { showInstallPrompt } from './installPrompt';
import { setupPostProcessing } from './setupPostProcessing';
import { isMobileDevice } from './isMobileDevice';

const canvas = document.getElementById('arena') as HTMLCanvasElement;
const container = canvas.parentElement ?? document.body;

initLandscapeEnforcer();
initAutoFullscreen();
showInstallPrompt();

function createMenuWorld(): { world: World; destroy: () => void } {
    const world = new World();

    installDefaults(world);
    installPhysics(world, { gravity: { x: 0, y: -20, z: 0 } });

    const mobile = isMobileDevice();
    const three = installThree(world, {
        canvas,
        clearColor: 0x050508,
    });

    if (mobile) {
        three.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    }

    if (!mobile) {
        three.renderer.shadowMap.enabled = true;
        three.renderer.shadowMap.type = 1; // THREE.PCFShadowMap
    }

    setupPostProcessing(three);

    world.mount(MenuSceneNode);

    return {
        world,
        destroy() {
            three.renderer.clear();
            world.destroy();
        },
    };
}

function startLocalGame(): Promise<void> {
    return new Promise((resolve) => {
        const world = new World();

        installDefaults(world);
        installAudio(world);
        installInput(world, { preventDefault: true, bindings: allBindings });
        installPhysics(world, { gravity: { x: 0, y: -20, z: 0 } });

        const mobile = isMobileDevice();
        const three = installThree(world, {
            canvas,
            clearColor: 0x050508,
        });

        // Cap pixel ratio at 2 on mobile — prevents 3x DPR phones
        // from rendering 9x the pixels for minimal visual difference.
        if (mobile) {
            three.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        }

        if (!mobile) {
            three.renderer.shadowMap.enabled = true;
            three.renderer.shadowMap.type = 1; // THREE.PCFShadowMap
        }
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

function startSoloGame(personality: AiPersonality): Promise<void> {
    return new Promise((resolve) => {
        const world = new World();

        installDefaults(world);
        installAudio(world);
        installInput(world, { preventDefault: true, bindings: allBindings });
        installPhysics(world, { gravity: { x: 0, y: -20, z: 0 } });

        const mobile = isMobileDevice();
        const three = installThree(world, {
            canvas,
            clearColor: 0x050508,
        });

        if (mobile) {
            three.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        }

        if (!mobile) {
            three.renderer.shadowMap.enabled = true;
            three.renderer.shadowMap.type = 1; // THREE.PCFShadowMap
        }
        const shockwavePass = setupPostProcessing(three);

        world.addSystem(new StatsOverlaySystem({ position: 'top-left' }));

        world.mount(ArenaNode, {
            shockwavePass,
            aiPersonality: personality,
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

            const mobile = isMobileDevice();
            const three = installThree(world, {
                canvas,
                clearColor: 0x050508,
            });

            if (mobile) {
                three.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
            }

            await installNetwork(world, {
                replication: { sendHz: 60 },
            });

            if (!mobile) {
                three.renderer.shadowMap.enabled = true;
                three.renderer.shadowMap.type = 1; // THREE.PCFShadowMap
            }
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
    const menuWorld = createMenuWorld();
    menuWorld.world.start();

    // Loop within the menu flow so the 3D background stays alive
    // when navigating back from sub-menus (e.g. lobby → main menu).
    let picked = false;
    while (!picked) {
        const choice = await showMainMenu(container);

        if (choice === 'solo') {
            const personality =
                AI_PERSONALITIES[
                    Math.floor(Math.random() * AI_PERSONALITIES.length)
                ];
            menuWorld.destroy();
            await startSoloGame(personality);
            picked = true;
        } else if (choice === 'local') {
            menuWorld.destroy();
            await startLocalGame();
            picked = true;
        } else {
            const lobby = await showLobby(container);
            if (lobby === 'back') {
                continue;
            }
            menuWorld.destroy();
            await startOnlineGame(lobby);
            picked = true;
        }
    }

    // Loop back to main menu after game ends
    start();
}

start();
