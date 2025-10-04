import { World } from '@pulse-ts/core';
import { attachComponent, getComponent } from '@pulse-ts/core';
import { Transform } from '@pulse-ts/core';
import { State } from '@pulse-ts/core';
import { useComponent } from '@pulse-ts/core';
import { installSave } from './install';
import { saveWorld, loadWorldRebuild } from './world';
import { defineFC } from './fc';

test('loadWorldRebuild remounts FCs and reapplies components', () => {
    const w = new World();
    installSave(w);

    const Box = defineFC<{ id: string; x: number }>(
        'example:box',
        ({ id, x }) => {
            // capture props into State for verification
            const s = useComponent(State);
            s.set('id', id);
            s.set('x', x);
        },
        {
            // Save only the id + x to minimize payload
            mapProps: (p) => ({ id: p.id, x: p.x }),
        },
    );

    // Mount two nodes with different props
    const n1 = w.mount(Box, { id: 'a', x: 1 });
    const n2 = w.mount(Box, { id: 'b', x: -2 });

    // Give them distinct transforms
    attachComponent(n1, Transform).setLocal({ position: { x: 1, y: 0, z: 0 } });
    attachComponent(n2, Transform).setLocal({
        position: { x: -2, y: 0, z: 0 },
    });

    const save = saveWorld(w, { includeTime: true });

    loadWorldRebuild(w, save, { applyTime: true, resetPrevious: true });

    // After rebuild, we expect the same number of nodes
    // and the same transform positions restored.
    const positions = [...w.nodes]
        .map((node) => getComponent(node, Transform))
        .filter((t): t is Transform => !!t)
        .map((t) => t.localPosition.x)
        .sort((a, b) => a - b);
    expect(positions).toEqual([-2, 1]);
});
