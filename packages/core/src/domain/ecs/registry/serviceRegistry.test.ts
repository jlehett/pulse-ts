import { Service } from '../base/Service';
import { ServiceRegistry } from './serviceRegistry';

class A extends Service {
    n = 1;
}
class B extends Service {
    s = 'x';
}

describe('ServiceRegistry', () => {
    test('set/get/remove by constructor', () => {
        const reg = new ServiceRegistry();
        const a = new A();
        const b = new B();

        reg.set(a);
        reg.set(b);

        expect(reg.get(A)?.n).toBe(1);
        expect(reg.get(B)?.s).toBe('x');

        reg.remove(A);
        expect(reg.get(A)).toBeUndefined();
        expect(reg.get(B)?.s).toBe('x');
    });
});
