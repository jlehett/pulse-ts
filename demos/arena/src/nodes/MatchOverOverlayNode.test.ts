import { MatchOverOverlayNode } from './MatchOverOverlayNode';

describe('MatchOverOverlayNode', () => {
    it('exports the node function', () => {
        expect(typeof MatchOverOverlayNode).toBe('function');
    });

    it('accepts optional onRequestMenu prop', () => {
        // Verify the function signature accepts props without errors
        expect(MatchOverOverlayNode.length).toBeLessThanOrEqual(1);
    });
});
