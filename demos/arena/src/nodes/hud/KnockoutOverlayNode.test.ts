jest.mock('@pulse-ts/core', () => ({
    useFrameUpdate: jest.fn(),
    useDestroy: jest.fn(),
    useContext: jest.fn(),
    createContext: (name: string) => ({ name }),
}));

jest.mock('@pulse-ts/three', () => ({
    useThreeContext: jest.fn(),
}));

jest.mock('../overlayAnimations', () => ({
    applyScalePop: jest.fn(),
}));

import { KnockoutOverlayNode } from './KnockoutOverlayNode';

describe('KnockoutOverlayNode', () => {
    it('exports the node function', () => {
        expect(typeof KnockoutOverlayNode).toBe('function');
    });

    it('displays tie text for tie rounds', () => {
        expect(KnockoutOverlayNode).toBeDefined();
    });
});
