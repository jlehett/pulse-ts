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
    useThreeContext: vi.fn(() => ({ renderer: { domElement: { parentElement: document.body } } })),
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

import {
    ReplayOverlayNode,
    LETTERBOX_HEIGHT,
    TRANSITION_FLASH_DURATION,
    SELF_KO_MESSAGES,
    SELF_KO_BOB_PERIOD,
    SELF_KO_BOB_STAGGER,
    SELF_KO_BOB_DISTANCE,
} from './ReplayOverlayNode';

describe('ReplayOverlayNode', () => {
    it('exports the node function', () => {
        expect(typeof ReplayOverlayNode).toBe('function');
    });

    it('letterbox height is a valid CSS value', () => {
        expect(LETTERBOX_HEIGHT).toMatch(/^\d+%$/);
    });

    it('transition flash duration is a short positive value', () => {
        expect(TRANSITION_FLASH_DURATION).toBeGreaterThan(0);
        expect(TRANSITION_FLASH_DURATION).toBeLessThan(1);
    });

    it('has a non-empty array of self-KO messages', () => {
        expect(SELF_KO_MESSAGES.length).toBeGreaterThan(0);
        for (const msg of SELF_KO_MESSAGES) {
            expect(typeof msg).toBe('string');
            expect(msg.length).toBeGreaterThan(0);
        }
    });

    it('self-KO bob animation constants are positive', () => {
        expect(SELF_KO_BOB_PERIOD).toBeGreaterThan(0);
        expect(SELF_KO_BOB_STAGGER).toBeGreaterThan(0);
        expect(SELF_KO_BOB_DISTANCE).toBeGreaterThan(0);
    });
});
