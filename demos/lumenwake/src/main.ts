import { World, installDefaults } from '@pulse-ts/core';
import { installAudio } from '@pulse-ts/audio';
import { installInput } from '@pulse-ts/input';
import { installPhysics } from '@pulse-ts/physics';
import { installThree } from '@pulse-ts/three';
import type { ThreeService } from '@pulse-ts/three';
import { installNetwork } from '@pulse-ts/network';
import { GameNode } from './nodes/GameNode';
import { showMainMenu } from './ui/menu';
import { showLobby, type LobbyResult } from './ui/lobby';
import { allBindings } from './config/bindings';
import { setupPostProcessing } from './rendering/setupPostProcessing';
import type { MapConfig } from './config/maps';
import type { ClassDef } from './config/classes';

const canvas = document.getElementById('lumenwake') as HTMLCanvasElement;
const container = canvas.parentElement ?? document.body;

// FPS counter
const fpsEl = document.createElement('div');
fpsEl.style.cssText =
    'position:fixed;top:8px;left:8px;color:#0f0;font:12px monospace;z-index:9999;pointer-events:none;';
document.body.appendChild(fpsEl);
let fpsFrames = 0;
let fpsLastTime = performance.now();
(function fpsLoop() {
    fpsFrames++;
    const now = performance.now();
    if (now - fpsLastTime >= 1000) {
        fpsEl.textContent = `${fpsFrames} FPS`;
        fpsFrames = 0;
        fpsLastTime = now;
    }
    requestAnimationFrame(fpsLoop);
})();

interface GameWorldResult {
    world: World;
    three: ThreeService;
    cleanup: () => void;
}

function createGameWorld(): GameWorldResult {
    const world = new World();

    installDefaults(world);
    installPhysics(world, { gravity: { x: 0, y: 0, z: 0 } });

    const three = installThree(world, {
        canvas,
        clearColor: 0x020206,
    });

    setupPostProcessing(three);

    const cleanup = () => {
        three.renderer.clear();
        world.destroy();
    };

    return { world, three, cleanup };
}

function startSoloGame(map: MapConfig, classDef: ClassDef): Promise<void> {
    return new Promise((resolve) => {
        const { world, cleanup } = createGameWorld();

        installAudio(world);
        installInput(world, { preventDefault: true, bindings: allBindings });

        world.mount(GameNode, {
            playerCount: 1,
            map,
            classDef,
            onRequestMenu: () => {
                cleanup();
                resolve();
            },
        });

        world.start();
    });
}

async function startOnlineGame(
    lobby: LobbyResult,
    map: MapConfig,
    classDef: ClassDef,
): Promise<void> {
    return new Promise((resolve) => {
        const setup = async () => {
            const { world, cleanup } = createGameWorld();

            installAudio(world);
            installInput(world, {
                preventDefault: true,
                bindings: allBindings,
            });

            await installNetwork(world, {
                replication: { sendHz: 60 },
            });

            world.mount(GameNode, {
                playerCount: lobby.playerCount,
                playerId: lobby.playerId,
                transport: lobby.transport,
                isHost: lobby.mode === 'host',
                map,
                classDef,
                onRequestMenu: () => {
                    lobby.transport.disconnect();
                    cleanup();
                    resolve();
                },
            });

            world.start();
        };
        setup();
    });
}

async function start() {
    while (true) {
        const choice = await showMainMenu(container);

        if (choice.mode === 'solo') {
            await startSoloGame(choice.map, choice.classDef);
        } else if (choice.mode === 'online') {
            const lobby = await showLobby(container);
            if (lobby === 'back') continue;
            await startOnlineGame(lobby, choice.map, choice.classDef);
        }
    }
}

start();
