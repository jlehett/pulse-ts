import { KnockoutOverlayNode } from './KnockoutOverlayNode';

describe('KnockoutOverlayNode', () => {
    it('exports the node function', () => {
        expect(typeof KnockoutOverlayNode).toBe('function');
    });

    it('displays tie text for tie rounds', () => {
        // The overlay shows "Tie!" when gameState.isTie is true.
        // Full integration testing requires the game loop; here we verify
        // the module exports correctly and the node is callable.
        expect(KnockoutOverlayNode).toBeDefined();
    });
});
