jest.mock('@pulse-ts/core', () => ({
    useFrameUpdate: jest.fn(),
    useDestroy: jest.fn(),
    createContext: (name: string) => ({ name }),
}));

jest.mock('@pulse-ts/three', () => ({
    useThreeContext: jest.fn(),
}));

jest.mock('@pulse-ts/network', () => ({
    useOnPeerLeave: jest.fn(),
}));

jest.mock('../overlayAnimations', () => ({
    applyStaggeredEntrance: jest.fn(),
}));

import { DisconnectOverlayNode } from './DisconnectOverlayNode';

describe('DisconnectOverlayNode', () => {
    it('exports the node function', () => {
        expect(typeof DisconnectOverlayNode).toBe('function');
    });
});
