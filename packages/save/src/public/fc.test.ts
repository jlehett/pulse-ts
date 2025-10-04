import { World } from '@pulse-ts/core';
import { installSave } from './install';
import { saveWorld } from './world';
import { defineFC, withSave, useSaveFC } from './fc';

test('defineFC auto-registers and records fc metadata', () => {
    const w = new World();
    installSave(w);

    const Thing = defineFC<{ n: number }>('test:thing', () => void 0);
    w.mount(Thing, { n: 3 });

    const save = saveWorld(w);
    const rec = save.nodes.find((r) => r.fc);
    expect(rec?.fc?.type).toBe('test:thing');
    expect(rec?.fc?.props).toEqual({ n: 3 });
});

test('withSave curried form works and supports prop mapping', () => {
    const w = new World();
    installSave(w);

    const Base = (p: { a: number; b: number }) => void p;
    const Saved = withSave<{ a: number; b: number }>('test:curried', {
        mapProps: ({ a }) => ({ a }),
    })(Base);

    w.mount(Saved, { a: 1, b: 2 });
    const save = saveWorld(w);
    const rec = save.nodes.find((r) => r.fc);
    expect(rec?.fc?.type).toBe('test:curried');
    expect(rec?.fc?.props).toEqual({ a: 1 });
});

test('useSaveFC records id/props when called directly', () => {
    const w = new World();
    installSave(w);

    const FC = (props: { k: string }) => {
        useSaveFC('x:direct', props);
    };
    w.mount(FC, { k: 'v' });
    const save = saveWorld(w);
    const rec = save.nodes.find((r) => r.fc);
    expect(rec?.fc?.type).toBe('x:direct');
    expect(rec?.fc?.props).toEqual({ k: 'v' });
});
