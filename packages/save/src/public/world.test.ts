import { World, Node } from '@pulse-ts/core';
import { attachComponent, getComponent } from '@pulse-ts/core';
import { Transform } from '@pulse-ts/core';
import { StableId } from '@pulse-ts/core';
import { installSave } from './install';
import { saveWorld, loadWorld } from './world';

test('saveWorld includes nodes, components, and optional time', () => {
    const w = new World();
    installSave(w);

    const a = new Node();
    const b = new Node();
    w.add(a);
    w.add(b);
    w.reparent(b, a);

    attachComponent(a, Transform).setLocal({ position: { x: 1, y: 2, z: 3 } });
    attachComponent(b, Transform).setLocal({ position: { x: -1, y: 0, z: 5 } });
    attachComponent(a, StableId).id = 'root';
    attachComponent(b, StableId).id = 'child';

    w.setTimeScale(0.5);
    w.pause();

    const save = saveWorld(w, { includeTime: true });
    expect(save.version).toBe(1);
    expect(save.time).toEqual({ timeScale: 0.5, paused: true });
    // Note: world may contain an internal system node; do not assert exact count
    const recA = save.nodes.find((n) => n.id === a.id)!;
    const recB = save.nodes.find((n) => n.id === b.id)!;
    expect(recA.parent).toBeNull();
    expect(recB.parent).toBe(a.id);
    expect(recA.components.some((c) => c.type === 'core:transform')).toBe(true);
    expect(recB.components.some((c) => c.type === 'core:transform')).toBe(true);
});

test('loadWorld applies by StableId (fallback to id), and can resetPrevious/applyTime', () => {
    const w = new World();
    installSave(w);

    const a = new Node();
    const b = new Node();
    w.add(a);
    w.add(b);
    w.reparent(b, a);

    const at = attachComponent(a, Transform);
    const bt = attachComponent(b, Transform);
    at.setLocal({ position: { x: 1, y: 2, z: 3 } });
    bt.setLocal({ position: { x: 2, y: 0, z: -1 } });
    attachComponent(a, StableId).id = 'root';
    attachComponent(b, StableId).id = 'child';

    const save = saveWorld(w, { includeTime: true });

    // Mutate world
    at.setLocal({ position: { x: 99, y: 99, z: 99 } });
    bt.setLocal({ position: { x: 88, y: 88, z: 88 } });
    w.setTimeScale(2);
    w.resume();

    loadWorld(w, save, { applyTime: true, resetPrevious: true });

    const at2 = getComponent(a, Transform)!;
    const bt2 = getComponent(b, Transform)!;
    expect(at2.localPosition.x).toBe(1);
    expect(bt2.localPosition.z).toBe(-1);
    // previous snapshot should be captured due to resetPrevious
    expect(at2.previousLocalPosition.x).toBe(1);
    expect(w.getTimeScale()).toBe(save.time!.timeScale);
    expect(w.isPaused()).toBe(save.time!.paused);
});
