jest.mock(
    '@pulse-ts/core',
    () => ({
        useFrameUpdate: jest.fn(),
        defineStore: (name: string, factory: () => any) => ({
            _key: Symbol(name),
            _factory: factory,
        }),
        useStore: jest.fn(),
    }),
    { virtual: true },
);

jest.mock(
    '@pulse-ts/three',
    () => ({
        useThreeContext: jest.fn(),
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

jest.mock(
    'three',
    () => ({
        Vector2: jest.fn().mockImplementation(() => ({ set: jest.fn() })),
        Vector3: jest.fn(),
    }),
    { virtual: true },
);

jest.mock('three/examples/jsm/postprocessing/ShaderPass.js', () => ({
    ShaderPass: jest.fn(),
}));

import { ShockwaveNode } from './ShockwaveNode';

describe('ShockwaveNode', () => {
    it('is an exported function', () => {
        expect(typeof ShockwaveNode).toBe('function');
    });
});
