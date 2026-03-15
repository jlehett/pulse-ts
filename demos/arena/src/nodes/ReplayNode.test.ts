import { vi, describe, it, expect } from 'vitest';

vi.mock('@pulse-ts/core', () => ({
    createContext: (name: string) => ({ name }),
    useFrameUpdate: vi.fn(),
    useDestroy: vi.fn(),
    useContext: vi.fn(),
    useWorld: vi.fn(() => ({ getService: vi.fn() })),
    defineStore: (name: string, factory: () => unknown) => ({
        _key: Symbol(name),
        _factory: factory,
    }),
    useStore: vi.fn(() => [{}]),
}));

vi.mock('@pulse-ts/three', () => ({
    useThreeContext: vi.fn(() => ({ camera: {} })),
}));

vi.mock('@pulse-ts/effects', () => ({
    useParticleBurst: vi.fn(() => vi.fn()),
    useClearParticles: vi.fn(() => vi.fn()),
    ParticlesService: {},
    useEffectPool: vi.fn(() => ({ trigger: vi.fn() })),
}));

vi.mock('@pulse-ts/audio', () => ({
    useSound: vi.fn(() => ({ play: vi.fn() })),
}));

vi.mock('three/examples/jsm/postprocessing/ShaderPass.js', () => ({
    ShaderPass: vi.fn(),
}));

vi.mock('../shockwave', () => ({
    useShockwavePool: vi.fn(() => ({ trigger: vi.fn() })),
    worldToScreen: vi.fn(() => [0, 0]),
}));

vi.mock('../hitImpact', () => ({
    useHitImpactPool: vi.fn(() => ({ trigger: vi.fn() })),
}));

vi.mock('./CameraRigNode', () => ({
    triggerCameraShake: vi.fn(),
}));

import { ReplayNode } from './ReplayNode';

describe('ReplayNode', () => {
    it('exports the node function', () => {
        expect(typeof ReplayNode).toBe('function');
    });
});
