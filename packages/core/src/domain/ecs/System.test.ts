import { World } from '../world/world';
import { System } from './System';

class TestSysEarly extends System {
    static updateKind: 'frame' | 'fixed' = 'frame';
    static updatePhase: 'early' | 'update' | 'late' = 'early';
    static order = 0;
    calls: number = 0;
    update(): void {
        this.calls++;
    }
}

class TestSysOrderA extends System {
    static updateKind: 'frame' | 'fixed' = 'frame';
    static updatePhase: 'early' | 'update' | 'late' = 'early';
    static order = -1;
    constructor(private log: string[]) {
        super();
    }
    update(): void {
        this.log.push('A');
    }
}

class TestSysOrderB extends System {
    static updateKind: 'frame' | 'fixed' = 'frame';
    static updatePhase: 'early' | 'update' | 'late' = 'early';
    static order = 1;
    constructor(private log: string[]) {
        super();
    }
    update(): void {
        this.log.push('B');
    }
}

describe('System attach/detach and ordering', () => {
    test('attach registers update; remove detaches', () => {
        const w = new World();
        const s = new TestSysEarly();
        w.addSystem(s);
        w.tick(16);
        expect(s.calls).toBe(1);
        w.removeSystem(TestSysEarly);
        w.tick(16);
        expect(s.calls).toBe(1);
    });

    test('static order controls execution order', () => {
        const w = new World();
        const order: string[] = [];
        w.addSystem(new TestSysOrderB(order));
        w.addSystem(new TestSysOrderA(order));
        w.tick(16);
        expect(order.join('')).toBe('AB');
    });
});
