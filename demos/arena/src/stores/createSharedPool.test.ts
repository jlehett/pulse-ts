jest.mock(
    '@pulse-ts/core',
    () => ({
        defineStore: (name: string, factory: () => any) => ({
            _key: Symbol(name),
            _factory: factory,
        }),
        useStore: jest.fn(),
    }),
    { virtual: true },
);

jest.mock(
    '@pulse-ts/effects',
    () => ({
        useEffectPool: jest.fn(),
    }),
    { virtual: true },
);

import { createSharedPool } from './createSharedPool';

describe('createSharedPool', () => {
    it('returns an object with Store and usePool', () => {
        const result = createSharedPool('test', {
            size: 2,
            duration: 1,
            create: () => ({ x: 0 }),
        });

        expect(result).toHaveProperty('Store');
        expect(result).toHaveProperty('usePool');
        expect(typeof result.usePool).toBe('function');
    });

    it('Store factory produces an object with null pool', () => {
        const { Store } = createSharedPool('test2', {
            size: 2,
            duration: 1,
            create: () => ({ x: 0 }),
        });

        const state = (Store as any)._factory();
        expect(state.pool).toBeNull();
    });

    it('Store has a _key symbol', () => {
        const { Store } = createSharedPool('myName', {
            size: 1,
            duration: 0.5,
            create: () => ({ v: 0 }),
        });

        expect((Store as any)._key).toBeDefined();
        expect(typeof (Store as any)._key).toBe('symbol');
    });
});
