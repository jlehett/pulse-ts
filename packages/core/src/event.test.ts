import { EventBus, TypedEvent } from './event';

describe('events', () => {
    test('TypedEvent on/once/emit/clear', () => {
        const e = new TypedEvent<number>();
        let a = 0;
        let b = 0;
        const off = e.on((v) => (a += v));
        e.once((v) => (b += v * 2));

        e.emit(2);
        e.emit(2);
        expect(a).toBe(4);
        expect(b).toBe(4);
        expect(e.size).toBe(1);

        off();
        expect(e.size).toBe(0);
        e.emit(1); // no-op
        expect(a).toBe(4);

        e.on(() => {});
        e.on(() => {});
        expect(e.size).toBe(2);
        e.clear();
        expect(e.size).toBe(0);
    });

    test('EventBus typed channels', () => {
        type E = { hit: { dmg: number }; spawn: { id: number } };
        const bus = new EventBus<E>();
        let hit = 0;
        let spawned: number[] = [];
        const off = bus.on('hit', (e) => (hit += e.dmg));
        bus.once('spawn', (e) => spawned.push(e.id));

        bus.emit('hit', { dmg: 3 });
        bus.emit('hit', { dmg: 2 });
        bus.emit('spawn', { id: 1 });
        bus.emit('spawn', { id: 2 });

        expect(hit).toBe(5);
        expect(spawned).toEqual([1]);
        expect(bus.size('hit')).toBe(1);
        off();
        expect(bus.size('hit')).toBe(0);
        bus.clear('spawn');
        expect(bus.size('spawn')).toBe(0);
    });
});
