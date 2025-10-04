import { Node } from '@pulse-ts/core';
import { Component } from '@pulse-ts/core';
import { attachComponent, getComponent } from '@pulse-ts/core';
import {
    registerComponentSerializer,
    serializeRegisteredComponents,
    deserializeComponents,
    __resetComponentRegistryForTests,
} from './componentRegistry';

class Dummy extends Component {
    value = 0;
}

beforeEach(() => __resetComponentRegistryForTests());

test('component registry: serialize/deserialize roundtrip', () => {
    registerComponentSerializer(Dummy, {
        id: 'test:dummy',
        serialize(_owner, d) {
            return { v: d.value };
        },
        deserialize(owner, data: any) {
            const c = attachComponent(owner, Dummy);
            c.value = data.v;
        },
    });

    const a = new Node();
    const aDummy = attachComponent(a, Dummy);
    aDummy.value = 42;

    const items = serializeRegisteredComponents(a);
    expect(items).toEqual([{ type: 'test:dummy', data: { v: 42 } }]);

    const b = new Node();
    deserializeComponents(b, items);
    const bDummy = getComponent(b, Dummy)!;
    expect(bDummy.value).toBe(42);
});

test('component registry: serialize skips undefined payloads', () => {
    registerComponentSerializer(Dummy, {
        id: 'test:dummy',
        serialize(_owner, d) {
            return d.value > 0 ? { v: d.value } : undefined;
        },
        deserialize(owner, data: any) {
            const c = attachComponent(owner, Dummy);
            c.value = data?.v ?? 0;
        },
    });

    const n = new Node();
    attachComponent(n, Dummy).value = 0;
    const items = serializeRegisteredComponents(n);
    expect(items).toEqual([]);
});
