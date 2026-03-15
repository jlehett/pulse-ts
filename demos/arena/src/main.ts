import { World, installDefaults } from '@pulse-ts/core';
import { installAudio } from '@pulse-ts/audio';
import { installInput } from '@pulse-ts/input';
import { installPhysics } from '@pulse-ts/physics';
import { installThree } from '@pulse-ts/three';
import type { ThreeService } from '@pulse-ts/three';
import { installNetwork } from '@pulse-ts/network';
import type { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { ArenaNode } from './nodes/ArenaNode';
import { MenuSceneNode } from './nodes/MenuSceneNode';
import { allBindings } from './config/bindings';
import { showMainMenu } from './menu';
import { showLobby, type LobbyResult } from './lobby';
import { AI_PERSONALITIES, type AiPersonality } from './ai/personalities';
import { installMobileSupport, isMobile } from '@pulse-ts/platform';
import { setupPostProcessing } from './setupPostProcessing';
import { startVersionPolling, isUpdateAvailable } from './versionCheck';

const canvas = document.getElementById('arena') as HTMLCanvasElement;
const container = canvas.parentElement ?? document.body;

installMobileSupport({
    fullscreen: true,
    orientation: 'landscape',
    installPrompt: true,
});
startVersionPolling();

interface GameWorldResult {
    world: World;
    three: ThreeService;
    shockwavePass: ShaderPass;
    cleanup: () => void;
}

/**
 * Create a fully-wired world with the shared boilerplate every game mode needs:
 * defaults, physics, Three.js renderer, mobile pixel-ratio cap, shadow maps
 * (desktop only), and post-processing.
 *
 * @returns The world, three service, shockwave pass, and a cleanup function.
 */
function createGameWorld(): GameWorldResult {
    const world = new World();

    installDefaults(world);
    installPhysics(world, { gravity: { x: 0, y: -20, z: 0 } });

    const mobile = isMobile();
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

    const cleanup = () => {
        three.renderer.clear();
        world.destroy();
    };

    return { world, three, shockwavePass, cleanup };
}

function createMenuWorld(): { world: World; destroy: () => void } {
    const { world, cleanup } = createGameWorld();
    world.mount(MenuSceneNode);
    return { world, destroy: cleanup };
}

function startLocalGame(): Promise<void> {
    return new Promise((resolve) => {
        const { world, shockwavePass, cleanup } = createGameWorld();

        installAudio(world);
        installInput(world, { preventDefault: true, bindings: allBindings });

        world.mount(ArenaNode, {
            shockwavePass,
            onRequestMenu: () => {
                cleanup();
                resolve();
            },
            onRequestRematch: () => {
                cleanup();
                startLocalGame().then(resolve);
            },
        });

        world.start();
    });
}

function startSoloGame(personality: AiPersonality): Promise<void> {
    return new Promise((resolve) => {
        const { world, shockwavePass, cleanup } = createGameWorld();

        installAudio(world);
        installInput(world, { preventDefault: true, bindings: allBindings });

        world.mount(ArenaNode, {
            shockwavePass,
            aiPersonality: personality,
            onRequestMenu: () => {
                cleanup();
                resolve();
            },
            onRequestRematch: () => {
                cleanup();
                startSoloGame(personality).then(resolve);
            },
        });

        world.start();
    });
}

async function startOnlineGame(lobby: LobbyResult): Promise<void> {
    return new Promise((resolve) => {
        const setup = async () => {
            const { world, shockwavePass, cleanup } = createGameWorld();

            installAudio(world);
            installInput(world, {
                preventDefault: true,
                bindings: allBindings,
            });

            await installNetwork(world, {
                replication: { sendHz: 60 },
            });

            world.mount(ArenaNode, {
                playerId: lobby.playerId,
                transport: lobby.transport,
                isHost: lobby.mode === 'host',
                shockwavePass,
                onRequestMenu: () => {
                    lobby.transport.disconnect();
                    cleanup();
                    resolve();
                },
                onRequestRematch: () => {
                    cleanup();
                    startOnlineGame(lobby).then(resolve);
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

    // If a new version was deployed while playing, reload now
    if (isUpdateAvailable()) {
        location.reload();
        return;
    }

    // Loop back to main menu after game ends
    start();
}

start();
