import { EVENTS } from '../config/events';
import { FLOOR_WAVES } from '../config/enemies';
import type { Rng } from './rng';

/** Node categories on the act map. */
export type MapNodeType = 'battle' | 'elite' | 'event' | 'boss';

/** One node of the act map DAG. */
export interface MapNode {
    id: string;
    /** 0-based floor; the boss sits on the last floor. */
    floor: number;
    /** Horizontal lane used for layout (0-based). */
    lane: number;
    type: MapNodeType;
    /** Index into the floor's wave variants (battle/elite/boss). */
    waveIndex: number;
    /** Event content id (event nodes only). */
    eventId?: string;
}

/** Directed edge between nodes on adjacent floors. */
export type MapEdge = [from: string, to: string];

/** The generated act map. */
export interface MapGraph {
    nodes: MapNode[];
    edges: MapEdge[];
    /** Number of floors including the boss floor. */
    floors: number;
}

/** Number of floors in an act (matches FLOOR_WAVES). */
export const ACT_FLOORS = FLOOR_WAVES.length;
/** Max lanes per floor. */
export const MAX_LANES = 4;

/** Fraction of non-boss, non-start nodes that become events. */
const EVENT_CHANCE = 0.28;
/** Fraction that become elites (floors 3+ only). */
const ELITE_CHANCE = 0.22;
const ELITE_MIN_FLOOR = 3;

/**
 * Generates the act map: a layered DAG of 8 floors. Floor 0 nodes are
 * always battles, the final floor is a single boss node, and intermediate
 * floors mix battles, elites (floor 3+) and signal events.
 *
 * Every node has at least one incoming and one outgoing edge, and edges
 * never cross more than one lane, keeping the layout readable.
 *
 * @param rng - Seeded RNG; the same seed yields the same map.
 * @returns The generated {@link MapGraph}.
 *
 * @example
 * const map = generateMap(createRng('OVR-3F9K2'));
 * map.nodes.filter((n) => n.type === 'boss'); // exactly one
 */
export function generateMap(rng: Rng): MapGraph {
    const nodes: MapNode[] = [];
    const edges: MapEdge[] = [];
    const floors = ACT_FLOORS;

    // Lane counts per floor: start 2-3, middle 3-4, then narrow to boss.
    const laneCounts: number[] = [];
    for (let f = 0; f < floors; f++) {
        if (f === floors - 1) laneCounts.push(1);
        else if (f === floors - 2) laneCounts.push(2);
        else if (f === 0) laneCounts.push(2 + rng.int(2));
        else laneCounts.push(3 + rng.int(2));
    }

    // Create nodes.
    const byFloor: MapNode[][] = [];
    let eventBudget = 0;
    for (let f = 0; f < floors; f++) {
        const row: MapNode[] = [];
        const count = laneCounts[f];
        for (let lane = 0; lane < count; lane++) {
            const id = `n${f}-${lane}`;
            let type: MapNodeType = 'battle';
            if (f === floors - 1) {
                type = 'boss';
            } else if (f > 0) {
                const roll = rng.next();
                if (roll < EVENT_CHANCE && eventBudget < 4) {
                    type = 'event';
                    eventBudget++;
                } else if (
                    f >= ELITE_MIN_FLOOR &&
                    roll < EVENT_CHANCE + ELITE_CHANCE
                ) {
                    type = 'elite';
                }
            }
            const waves = FLOOR_WAVES[f];
            const node: MapNode = {
                id,
                floor: f,
                lane,
                type,
                waveIndex: rng.int(waves.length),
            };
            if (type === 'event') node.eventId = rng.pick(EVENTS).id;
            row.push(node);
        }
        // Guarantee at least one non-event path per floor so a player can
        // always fight (events can't be the only option).
        if (row.length > 0 && row.every((n) => n.type === 'event')) {
            const n = rng.pick(row);
            n.type = 'battle';
            delete n.eventId;
        }
        byFloor.push(row);
        nodes.push(...row);
    }

    // Connect adjacent floors without crossing edges: map each node's lane
    // proportionally into the next floor's lane range, linking to 1-2
    // nearby nodes.
    for (let f = 0; f < floors - 1; f++) {
        const from = byFloor[f];
        const to = byFloor[f + 1];
        const linked = new Set<string>();
        for (let i = 0; i < from.length; i++) {
            const center =
                from.length === 1
                    ? (to.length - 1) / 2
                    : (i / (from.length - 1)) * (to.length - 1);
            const primary = Math.round(center);
            const targets = new Set<number>([clampLane(primary, to.length)]);
            if (rng.next() < 0.45) {
                const side = rng.next() < 0.5 ? -1 : 1;
                targets.add(clampLane(primary + side, to.length));
            }
            for (const t of targets) {
                edges.push([from[i].id, to[t].id]);
                linked.add(to[t].id);
            }
        }
        // Ensure every next-floor node is reachable.
        for (let j = 0; j < to.length; j++) {
            if (linked.has(to[j].id)) continue;
            const center =
                to.length === 1
                    ? (from.length - 1) / 2
                    : (j / (to.length - 1)) * (from.length - 1);
            const src = from[clampLane(Math.round(center), from.length)];
            edges.push([src.id, to[j].id]);
        }
    }

    return { nodes, edges, floors };
}

function clampLane(lane: number, count: number): number {
    return Math.max(0, Math.min(count - 1, lane));
}

/** Node lookup helper. */
export function nodeById(map: MapGraph, id: string): MapNode {
    const node = map.nodes.find((n) => n.id === id);
    if (!node) throw new Error(`Unknown map node: ${id}`);
    return node;
}

/** Successor node ids of a node. */
export function successors(map: MapGraph, id: string): string[] {
    return map.edges.filter(([from]) => from === id).map(([, to]) => to);
}

/**
 * Nodes the player may embark to next: floor-0 nodes when the run just
 * started, otherwise the successors of the current node.
 */
export function availableNodes(
    map: MapGraph,
    currentNodeId: string | null,
): string[] {
    if (currentNodeId === null) {
        return map.nodes.filter((n) => n.floor === 0).map((n) => n.id);
    }
    return successors(map, currentNodeId);
}
