import { Transform } from '../../components/spatial/Transform';
import { World } from '../../world/world';
import { Component } from '../base/Component';
import {
    attachComponent,
    getComponent,
    setComponent,
} from './componentRegistry';
import { Node } from '../base/node';

class Foo extends Component {
    v = 0;
}

describe('component registry', () => {
    test('attach/get/set roundtrip and singleton per owner', () => {
        const n = new Node();
        const a = attachComponent(n, Foo);
        expect(a).toBeInstanceOf(Foo);
        const b = getComponent(n, Foo);
        expect(b).toBe(a);

        const c = new Foo();
        setComponent(n, c);
        expect(getComponent(n, Foo)).toBe(c);
    });

    test('Transform registers with world and survives caching', () => {
        const w = new World({});
        const n = w.add(new Node());
        expect(w.debugStats().transforms).toBe(0);
        const t = attachComponent(n, Transform);
        // first attach when node already in world should not auto-register;
        // Transform.attach checks owner.world at attach-time only.
        // So reattach by setting again shouldn't create a new one.
        expect(t).toBe(attachComponent(n, Transform));
        // Since attach happened after add, world.registerTransform should have run.
        // Verify via stats by forcing world composition query.
        t.getWorldTRS(undefined, 0);
        expect(w.debugStats().transforms).toBe(1);
    });
});
