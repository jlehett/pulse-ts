import { CtorRegistry } from './CtorRegistry';

class Base {}
class A extends Base {
    n = 1;
}
class B extends Base {
    s = 'x';
}

describe('CtorRegistry', () => {
    test('set/get/remove/values/clear', () => {
        const reg = new CtorRegistry<Base>();
        const a = new A();
        const b = new B();

        reg.set(a);
        reg.set(b);
        expect(reg.get(A)).toBe(a);
        expect(reg.get(B)).toBe(b);

        // values contains both
        const arr = Array.from(reg.values());
        expect(arr.includes(a)).toBe(true);
        expect(arr.includes(b)).toBe(true);

        // remove A
        reg.remove(A);
        expect(reg.get(A)).toBeUndefined();
        expect(reg.get(B)).toBe(b);

        // clear
        reg.clear();
        expect(Array.from(reg.values()).length).toBe(0);
    });
});
