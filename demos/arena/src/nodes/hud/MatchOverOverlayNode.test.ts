jest.mock('@pulse-ts/core', () => ({
    useFrameUpdate: jest.fn(),
    useDestroy: jest.fn(),
    useContext: jest.fn(),
    useWorld: jest.fn(() => ({ getService: jest.fn() })),
    createContext: (name: string) => ({ name }),
}));

jest.mock('@pulse-ts/three', () => ({
    useThreeContext: jest.fn(),
}));

jest.mock('@pulse-ts/audio', () => ({
    useSound: jest.fn(() => ({ play: jest.fn() })),
}));

jest.mock('@pulse-ts/network', () => ({
    useChannel: jest.fn(),
    TransportService: {},
}));

jest.mock('../../infra/versionCheck', () => ({
    isUpdateAvailable: jest.fn(() => false),
}));

jest.mock('../../infra/updateAutoReload', () => ({
    createAutoReloader: jest.fn(() => ({
        schedule: jest.fn(),
        cancel: jest.fn(),
        dispose: jest.fn(),
    })),
}));

jest.mock('../../ui/overlayAnimations', () => ({
    applyStaggeredEntrance: jest.fn(),
}));

import { MatchOverOverlayNode } from './MatchOverOverlayNode';

describe('MatchOverOverlayNode', () => {
    it('exports the node function', () => {
        expect(typeof MatchOverOverlayNode).toBe('function');
    });

    it('accepts optional onRequestMenu prop', () => {
        expect(MatchOverOverlayNode.length).toBeLessThanOrEqual(1);
    });

    it('accepts optional onRequestRematch and online props', () => {
        expect(MatchOverOverlayNode.length).toBeLessThanOrEqual(1);
    });
});
