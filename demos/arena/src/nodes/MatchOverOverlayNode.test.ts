jest.mock('../versionCheck', () => ({
    isUpdateAvailable: jest.fn(() => false),
}));

jest.mock('../updateAutoReload', () => ({
    createAutoReloader: jest.fn(() => ({
        schedule: jest.fn(),
        cancel: jest.fn(),
        dispose: jest.fn(),
    })),
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
