import type { World } from '@pulse-ts/core';
import { Node } from '@pulse-ts/core';
import { getComponent } from '@pulse-ts/core';
import { Transform } from '@pulse-ts/core';
import {
    SaveFile,
    SaveFileV1,
    SaveOptions,
    LoadOptions,
    SaveNodeRecord,
} from './types';
import {
    serializeRegisteredComponents,
    deserializeComponents,
} from './registry';

function buildIdToNode(world: World): Map<number, Node> {
    const m = new Map<number, Node>();
    for (const n of world.nodes) m.set(n.id, n);
    return m;
}

export function saveWorld(world: World, opts: SaveOptions = {}): SaveFileV1 {
    const nodes: SaveNodeRecord[] = [];
    for (const n of world.nodes) {
        nodes.push({
            id: n.id,
            parent: n.parent ? n.parent.id : null,
            components: serializeRegisteredComponents(n),
        });
    }
    const out: SaveFileV1 = { version: 1, nodes };
    if (opts.includeTime) {
        out.time = {
            timeScale: world.getTimeScale(),
            paused: world.isPaused(),
        };
    }
    return out;
}

export function loadWorld(
    world: World,
    save: SaveFile,
    opts: LoadOptions = {},
) {
    if (!save || save.version !== 1) throw new Error('Unsupported save format');
    const strict = !!opts.strict;
    const idToNode = buildIdToNode(world);

    for (const rec of save.nodes) {
        const node = idToNode.get(rec.id);
        if (!node) {
            if (strict) throw new Error(`loadWorld: missing node ${rec.id}`);
            continue;
        }
        if (rec.components && rec.components.length) {
            deserializeComponents(node, rec.components);
        }
    }

    if (opts.resetPrevious) {
        for (const n of world.nodes) {
            const t = getComponent(n, Transform);
            if (t) t.snapshotPrevious();
        }
    }

    if (opts.applyTime && save.time) {
        world.setTimeScale(save.time.timeScale);
        if (save.time.paused) world.pause();
        else world.resume();
    }
}

/**
 * Rebuilds the world from a save file:
 * - Clears the current scene (preserving internal system node)
 * - Recreates nodes and hierarchy
 * - Applies components via registered serializers
 * - Optionally applies time state
 */
export function loadWorldRebuild(
    world: World,
    save: SaveFile,
    opts: LoadOptions = {},
) {
    if (!save || save.version !== 1) throw new Error('Unsupported save format');
    if (typeof (world as any).clearScene === 'function') {
        (world as any).clearScene();
    } else {
        // Fallback: best-effort remove all roots (may also remove system node)
        const roots: Node[] = [];
        for (const n of world.nodes) if (!n.parent) roots.push(n);
        for (const r of roots) (r as any).destroy?.();
    }

    const idToNode = new Map<number, Node>();
    // First pass: create nodes
    for (const rec of save.nodes) {
        const n = new (Node as any)() as Node;
        world.add(n);
        idToNode.set(rec.id, n);
    }
    // Second pass: parent relationships
    for (const rec of save.nodes) {
        const child = idToNode.get(rec.id)!;
        const parent =
            rec.parent != null ? (idToNode.get(rec.parent) ?? null) : null;
        world.reparent(child, parent);
    }
    // Third pass: components
    for (const rec of save.nodes) {
        const n = idToNode.get(rec.id)!;
        if (rec.components && rec.components.length) {
            deserializeComponents(n, rec.components);
        }
    }

    if (opts.resetPrevious) {
        for (const [, n] of idToNode) {
            const t = getComponent(n, Transform);
            if (t) t.snapshotPrevious();
        }
    }

    if (opts.applyTime && save.time) {
        world.setTimeScale(save.time.timeScale);
        if (save.time.paused) world.pause();
        else world.resume();
    }
}
