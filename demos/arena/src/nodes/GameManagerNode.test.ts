import {
    GameManagerNode,
    computeCountdownValue,
    type GameManagerNodeProps,
} from './GameManagerNode';
import { TIE_WINDOW_FRAMES } from '../config/arena';

describe('GameManagerNode', () => {
    it('exports the node function', () => {
        expect(typeof GameManagerNode).toBe('function');
    });

    it('accepts optional online and isHost props', () => {
        // Type-level check — props are optional
        const props: GameManagerNodeProps = { online: true, isHost: true };
        expect(props.online).toBe(true);
        expect(props.isHost).toBe(true);
    });
});

describe('computeCountdownValue', () => {
    it('returns 3 when remaining is above 3', () => {
        expect(computeCountdownValue(3.5)).toBe(3);
        expect(computeCountdownValue(4.0)).toBe(3);
    });

    it('returns 3 at exactly remaining > 3 boundary', () => {
        expect(computeCountdownValue(3.01)).toBe(3);
    });

    it('returns 2 when remaining is between 2 and 3', () => {
        expect(computeCountdownValue(3.0)).toBe(2);
        expect(computeCountdownValue(2.5)).toBe(2);
        expect(computeCountdownValue(2.01)).toBe(2);
    });

    it('returns 1 when remaining is between 1 and 2', () => {
        expect(computeCountdownValue(2.0)).toBe(1);
        expect(computeCountdownValue(1.5)).toBe(1);
        expect(computeCountdownValue(1.01)).toBe(1);
    });

    it('returns 0 (GO!) when remaining is 1 or below', () => {
        expect(computeCountdownValue(1.0)).toBe(0);
        expect(computeCountdownValue(0.5)).toBe(0);
        expect(computeCountdownValue(0)).toBe(0);
    });
});

describe('TIE_WINDOW_FRAMES', () => {
    it('is a positive integer', () => {
        expect(TIE_WINDOW_FRAMES).toBeGreaterThan(0);
        expect(Number.isInteger(TIE_WINDOW_FRAMES)).toBe(true);
    });

    it('is 10 frames (~167ms at 60Hz)', () => {
        expect(TIE_WINDOW_FRAMES).toBe(10);
    });
});
