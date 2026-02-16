import { World } from '@pulse-ts/core';
import { Service } from '@pulse-ts/core';
import {
    registerServiceSerializer,
    serializeRegisteredServices,
    deserializeServices,
    __resetServiceRegistryForTests,
} from './serviceRegistry';

class DummyService extends Service {
    value = 0;
}

beforeEach(() => __resetServiceRegistryForTests());

test('service registry: serialize/deserialize applies to existing service', () => {
    registerServiceSerializer(DummyService, {
        id: 'test:svc',
        serialize(_world, svc) {
            return { v: svc.value };
        },
        deserialize(world, data: any) {
            const svc = world.getService(DummyService)!;
            if (svc) svc.value = data.v;
        },
    });

    const w = new World();
    const svc = w.provideService(new DummyService());
    svc.value = 7;

    const items = serializeRegisteredServices(w);
    expect(items).toEqual([{ type: 'test:svc', data: { v: 7 } }]);

    // Change the value; then apply serialized data back
    svc.value = 1;
    deserializeServices(w, items);
    expect(svc.value).toBe(7);
});
