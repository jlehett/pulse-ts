import type { World } from '@pulse-ts/core';
import { Node } from '@pulse-ts/core';
import { getComponent } from '@pulse-ts/core';
import { Transform } from '@pulse-ts/core';
import { StableId } from '@pulse-ts/core';
import {
    SaveFile,
    SaveOptions,
    LoadOptions,
    SaveNodeRecord,
} from '../public/types';
import {
    serializeRegisteredComponents,
    deserializeComponents,
} from './registries/componentRegistry';
import {
    serializeRegisteredServices,
    deserializeServices,
} from './registries/serviceRegistry';
import { SaveFC } from './components/SaveFC';
import { getFC } from './registries/fcRegistry';

function buildIdToNode(world: World): Map<number, Node> {
    const m = new Map<number, Node>();
    for (const n of world.nodes) m.set(n.id, n);
    return m;
}

function buildStableIdToNode(world: World): Map<string, Node> {
    const m = new Map<string, Node>();
    for (const n of world.nodes) {
        const sid = getComponent(n, StableId);
        if (sid && sid.id) m.set(sid.id, n);
    }
    return m;
}

function extractStableId(rec: SaveNodeRecord): string | null {
    if (!rec.components) return null;
    for (const c of rec.components)
        if (c.type === 'core:stableId') {
            const id = (c.data as any)?.id;
            return typeof id === 'string' ? id : null;
        }
    return null;
}

export function saveWorld(world: World, opts: SaveOptions = {}): SaveFile {
    const nodes: SaveNodeRecord[] = [];
    for (const n of world.nodes) {
        const fcMeta = getComponent(n, SaveFC);
        nodes.push({
            id: n.id,
            parent: n.parent ? n.parent.id : null,
            components: serializeRegisteredComponents(n),
            fc:
                fcMeta && fcMeta.type
                    ? { type: fcMeta.type, props: fcMeta.props }
                    : undefined,
        });
    }
    const out: SaveFile = {
        version: opts.version ?? 1,
        services: serializeRegisteredServices(world),
        nodes,
    };
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
    if (!save) throw new Error('Save file is required');
    const strict = !!opts.strict;
    const idToNode = buildIdToNode(world);
    const stableToNode = buildStableIdToNode(world);

    for (const rec of save.nodes) {
        const sid = extractStableId(rec);
        const node =
            (sid ? stableToNode.get(sid) : undefined) ?? idToNode.get(rec.id);
        if (!node) {
            if (strict) throw new Error(`loadWorld: missing node ${rec.id}`);
            continue;
        }
        if (rec.components && rec.components.length) {
            deserializeComponents(node, rec.components);
        }
    }

    deserializeServices(world, save.services);

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

export function loadWorldRebuild(
    world: World,
    save: SaveFile,
    opts: LoadOptions = {},
) {
    if (!save) throw new Error('Save file is required');
    if (typeof (world as any).clearScene === 'function') {
        (world as any).clearScene();
    } else {
        const roots: Node[] = [];
        for (const n of world.nodes) if (!n.parent) roots.push(n);
        for (const r of roots) (r as any).destroy?.();
    }

    const idToNode = new Map<number, Node>();
    // First pass: create/mount nodes
    for (const rec of save.nodes) {
        let n: Node;
        const fcId = (rec as any).fc?.type as string | undefined;
        const fcProps = (rec as any).fc?.props as any;
        const fc = fcId ? getFC(fcId) : undefined;
        if (fc) {
            n = world.mount(fc, fcProps);
        } else {
            if (fcId && !fc) {
                try {
                    console.warn(
                        `@pulse-ts/save: missing FC registration for "${fcId}" during rebuild. ` +
                            `Register it via registerFC(...) or wrap with defineFC(...).`,
                    );
                } catch {}
            }
            n = new (Node as any)() as Node;
            world.add(n);
        }
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

    deserializeServices(world, save.services);

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
