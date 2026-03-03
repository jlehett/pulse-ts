import { ScoreHudNode, SCORE_COLORS } from './ScoreHudNode';

describe('ScoreHudNode', () => {
    it('exports the node function', () => {
        expect(typeof ScoreHudNode).toBe('function');
    });

    it('exports SCORE_COLORS with teal and coral', () => {
        expect(SCORE_COLORS).toEqual(['#48c9b0', '#e74c3c']);
    });

    it('SCORE_COLORS has exactly two entries', () => {
        expect(SCORE_COLORS).toHaveLength(2);
    });
});
