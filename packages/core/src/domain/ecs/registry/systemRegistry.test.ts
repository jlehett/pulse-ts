import { System } from '../base/System';
import { SystemRegistry } from './systemRegistry';

class S1 extends System {
    update(): void {}
}
class S2 extends System {
    update(): void {}
}

describe('SystemRegistry', () => {
    test('set/get/remove by constructor', () => {
        const reg = new SystemRegistry();
        const s1 = new S1();
        const s2 = new S2();

        reg.set(s1);
        reg.set(s2);

        expect(reg.get(S1)).toBe(s1);
        expect(reg.get(S2)).toBe(s2);

        reg.remove(S1);
        expect(reg.get(S1)).toBeUndefined();
        expect(reg.get(S2)).toBe(s2);
    });
});
