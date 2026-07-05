import {
    ACT_FLOORS,
    availableNodes,
    generateMap,
    nodeById,
    successors,
    type MapGraph,
} from './mapGen';
import { createRng } from './rng';

const genMaps = (count: number): MapGraph[] =>
    Array.from({ length: count }, (_, i) =>
        generateMap(createRng(`seed-${i}`)),
    );

describe('generateMap', () => {
    it('is deterministic per seed', () => {
        const a = generateMap(createRng('OVR-MAP'));
        const b = generateMap(createRng('OVR-MAP'));
        expect(a).toEqual(b);
    });

    it('has exactly one boss node on the final floor', () => {
        for (const map of genMaps(10)) {
            const bosses = map.nodes.filter((n) => n.type === 'boss');
            expect(bosses).toHaveLength(1);
            expect(bosses[0].floor).toBe(ACT_FLOORS - 1);
        }
    });

    it('floor 0 contains only battles', () => {
        for (const map of genMaps(10)) {
            for (const node of map.nodes.filter((n) => n.floor === 0)) {
                expect(node.type).toBe('battle');
            }
        }
    });

    it('elites never appear before their minimum floor', () => {
        for (const map of genMaps(20)) {
            for (const node of map.nodes.filter((n) => n.type === 'elite')) {
                expect(node.floor).toBeGreaterThanOrEqual(3);
            }
        }
    });

    it('every node is reachable from floor 0 and reaches the boss', () => {
        for (const map of genMaps(20)) {
            // Forward reachability.
            const reachable = new Set(
                map.nodes.filter((n) => n.floor === 0).map((n) => n.id),
            );
            for (let f = 0; f < map.floors - 1; f++) {
                for (const node of map.nodes.filter((n) => n.floor === f)) {
                    if (!reachable.has(node.id)) continue;
                    for (const next of successors(map, node.id)) {
                        reachable.add(next);
                    }
                }
            }
            for (const node of map.nodes) {
                expect(reachable.has(node.id)).toBe(true);
            }
            // Every non-boss node has at least one outgoing edge.
            for (const node of map.nodes.filter(
                (n) => n.floor < map.floors - 1,
            )) {
                expect(successors(map, node.id).length).toBeGreaterThan(0);
            }
        }
    });

    it('every event node has content', () => {
        for (const map of genMaps(20)) {
            for (const node of map.nodes.filter((n) => n.type === 'event')) {
                expect(node.eventId).toBeTruthy();
            }
        }
    });

    it('edges only connect adjacent floors', () => {
        for (const map of genMaps(10)) {
            for (const [from, to] of map.edges) {
                expect(nodeById(map, to).floor).toBe(
                    nodeById(map, from).floor + 1,
                );
            }
        }
    });

    it('availableNodes returns floor 0 pre-embark, successors after', () => {
        const map = generateMap(createRng('OVR-AVAIL'));
        const start = availableNodes(map, null);
        expect(start.length).toBeGreaterThan(0);
        for (const id of start) {
            expect(nodeById(map, id).floor).toBe(0);
        }
        const after = availableNodes(map, start[0]);
        expect(after).toEqual(successors(map, start[0]));
    });
});
