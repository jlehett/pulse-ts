import { World, installDefaults } from '@pulse-ts/core';
import { installAudio } from '@pulse-ts/audio';
import { installInput } from '@pulse-ts/input';
import { installThree } from '@pulse-ts/three';
import { BINDINGS } from './config/bindings';
import { EVENT_BY_ID } from './config/events';
import { THEME } from './config/theme';
import { BattleNode } from './nodes/BattleNode';
import { preloadCustomModels } from './nodes/units/customModel';
import { setupRenderer } from './rendering/setupRenderer';
import { clearRun, loadRun, saveRun } from './run/persistence';
import type { MapNode } from './run/mapGen';
import {
    completeEventNode,
    createRun,
    currentNode,
    embark,
    type RunState,
} from './run/runState';
import { showAugmentScreen } from './ui/augment';
import { showEventScreen } from './ui/event';
import { showMainMenu } from './ui/menu';
import { showMapScreen } from './ui/map';
import { showSummaryScreen } from './ui/summary';

const canvas = document.getElementById('overclock') as HTMLCanvasElement;
const container = document.body;

/**
 * Runs one battle-node visit in a fresh world. Resolves when the player
 * leaves the battle (victory, retreat-after-loss, or run end).
 */
function playBattle(run: RunState, node: MapNode): Promise<void> {
    return new Promise((resolve) => {
        const world = new World();
        installDefaults(world);
        const three = installThree(world, {
            canvas,
            clearColor: THEME.bgNum,
        });
        setupRenderer(three);
        installInput(world, { bindings: BINDINGS });
        installAudio(world, { masterVolume: 0.9 });

        world.mount(BattleNode, {
            run,
            node,
            onComplete: () => {
                three.renderer.clear();
                world.destroy();
                resolve();
            },
        });
        world.start();
    });
}

/** Plays a run until victory or defeat. */
async function playRun(run: RunState): Promise<void> {
    while (run.status === 'active') {
        saveRun(run);

        // Owed augment picks come first (elite wins, events, milestones).
        if (run.pendingAugments > 0) {
            await showAugmentScreen(container, run);
            continue;
        }

        // Retry an unfinished battle node (post-loss regroup) before
        // offering new map choices.
        const standing = currentNode(run);
        const unresolved =
            standing !== null &&
            standing.type !== 'event' &&
            !run.completedNodes.includes(standing.id);

        let node: MapNode;
        if (unresolved) {
            node = standing;
        } else {
            const nodeId = await showMapScreen(container, run);
            const embarked = embark(run, nodeId);
            if (!embarked) continue;
            node = embarked;
            saveRun(run);
        }

        if (node.type === 'event') {
            const event = node.eventId
                ? EVENT_BY_ID.get(node.eventId)
                : undefined;
            if (event) await showEventScreen(container, run, event);
            completeEventNode(run);
        } else {
            await playBattle(run, node);
        }
    }

    clearRun();
    await showSummaryScreen(container, run);
}

/** Top-level screen loop: menu → run → menu, forever. */
async function start(): Promise<void> {
    for (;;) {
        const saved = loadRun();
        const choice = await showMainMenu(
            container,
            saved
                ? {
                      floor: (currentNode(saved)?.floor ?? 0) + 1,
                      floors: saved.map.floors,
                      core: saved.core,
                  }
                : null,
        );
        const run =
            choice.action === 'continue' && saved
                ? saved
                : createRun(choice.seed);
        await playRun(run);
    }
}

// Start fetching custom unit models before the first board render.
preloadCustomModels();

const fxlab = new URLSearchParams(location.search).get('fxlab');
if (import.meta.env.DEV && fxlab) {
    // Dev-only ability-VFX inspection loop; see src/dev/fxLab.ts.
    void import('./dev/fxLab').then((m) => m.startFxLab(fxlab));
} else {
    void start();
}
