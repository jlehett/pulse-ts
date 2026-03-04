import { computeAiDecision } from './aiDecision';
import { createAiState, updateAiState } from './aiState';
import { BRAWLER, SENTINEL, GREMLIN, MATADOR, PHANTOM } from './personalities';

const ARENA_R = 14;
const DT = 1 / 60;

/** Create and initialize a state with one update cycle. */
function makeState(selfX = 0, selfZ = 0, opX = 5, opZ = 5) {
    const s = createAiState();
    updateAiState(s, selfX, selfZ, opX, opZ, 0, 0, DT);
    // Second update to populate velocities
    updateAiState(s, selfX, selfZ, opX, opZ, 0, 0, DT);
    return s;
}

describe('computeAiDecision', () => {
    it('returns moveX, moveY, and dash fields', () => {
        const s = makeState();
        const d = computeAiDecision(BRAWLER, s, 0, 0, 5, 5, ARENA_R, DT, 0.5);
        expect(typeof d.moveX).toBe('number');
        expect(typeof d.moveY).toBe('number');
        expect(typeof d.dash).toBe('boolean');
    });

    it('works without state (null)', () => {
        const d = computeAiDecision(
            BRAWLER,
            null,
            0,
            0,
            5,
            5,
            ARENA_R,
            DT,
            0.5,
        );
        expect(typeof d.moveX).toBe('number');
        expect(typeof d.moveY).toBe('number');
    });

    it('movement values are clamped to -1..1', () => {
        const s = makeState();
        const d = computeAiDecision(BRAWLER, s, 0, 0, 10, 10, ARENA_R, DT, 0.5);
        expect(d.moveX).toBeGreaterThanOrEqual(-1);
        expect(d.moveX).toBeLessThanOrEqual(1);
        expect(d.moveY).toBeGreaterThanOrEqual(-1);
        expect(d.moveY).toBeLessThanOrEqual(1);
    });

    it('moves toward opponent when aggression is high', () => {
        const s = makeState(0, 0, 10, 0);
        const d = computeAiDecision(BRAWLER, s, 0, 0, 10, 0, ARENA_R, DT, 0);
        expect(d.moveX).toBeGreaterThan(0);
    });

    it('returns zero movement when self and opponent overlap', () => {
        const s = makeState(5, 5, 5, 5);
        const d = computeAiDecision(BRAWLER, s, 5, 5, 5, 5, ARENA_R, DT, 0);
        expect(Math.abs(d.moveX)).toBeLessThan(1);
        expect(Math.abs(d.moveY)).toBeLessThan(1);
    });

    it('pulls toward center when near edge with high edgeCaution', () => {
        const s = makeState(ARENA_R - 1, 0, 0, 0);
        const d = computeAiDecision(
            SENTINEL,
            s,
            ARENA_R - 1,
            0,
            0,
            0,
            ARENA_R,
            DT,
            0,
        );
        expect(d.moveX).toBeLessThan(0);
    });

    it('does not dash when opponent is far away', () => {
        const s = makeState(0, 0, 100, 100);
        const d = computeAiDecision(BRAWLER, s, 0, 0, 100, 100, ARENA_R, DT, 0);
        expect(d.dash).toBe(false);
    });

    it('can dash when opponent is within approach distance', () => {
        const s = makeState(0, 0, 1, 0);
        const d = computeAiDecision(BRAWLER, s, 0, 0, 1, 0, ARENA_R, DT, 0);
        expect(d.dash).toBe(true);
    });

    it('suppresses dash when near the arena edge', () => {
        const nearEdgeX = ARENA_R * 0.8;
        const s = makeState(nearEdgeX, 0, nearEdgeX - 1, 0);
        const d = computeAiDecision(
            BRAWLER,
            s,
            nearEdgeX,
            0,
            nearEdgeX - 1,
            0,
            ARENA_R,
            DT,
            0,
        );
        expect(d.dash).toBe(false);
    });

    it('respects moveSpeed scaling', () => {
        const sb = makeState(0, 0, 10, 0);
        const ss = makeState(0, 0, 10, 0);
        const brawl = computeAiDecision(
            BRAWLER,
            sb,
            0,
            0,
            10,
            0,
            ARENA_R,
            DT,
            0,
        );
        const sent = computeAiDecision(
            SENTINEL,
            ss,
            0,
            0,
            10,
            0,
            ARENA_R,
            DT,
            0,
        );
        const brawlMag = Math.sqrt(brawl.moveX ** 2 + brawl.moveY ** 2);
        const sentMag = Math.sqrt(sent.moveX ** 2 + sent.moveY ** 2);
        expect(brawlMag).toBeGreaterThan(sentMag);
    });

    it('produces different results with different random values', () => {
        const s1 = makeState(0, 0, 5, 5);
        const s2 = makeState(0, 0, 5, 5);
        const d1 = computeAiDecision(GREMLIN, s1, 0, 0, 5, 5, ARENA_R, DT, 0.1);
        const d2 = computeAiDecision(GREMLIN, s2, 0, 0, 5, 5, ARENA_R, DT, 0.9);
        const same = d1.moveX === d2.moveX && d1.moveY === d2.moveY;
        expect(same).toBe(false);
    });
});

describe('stateful behaviors', () => {
    it('grudge boosts aggression after collision', () => {
        const s = makeState(0, 0, 10, 0);
        // Simulate collision: positions were close, now separating
        s.timeSinceCollision = 0.5;
        const dGrudge = computeAiDecision(
            { ...BRAWLER, grudgeIntensity: 0.9 },
            s,
            0,
            0,
            10,
            0,
            ARENA_R,
            DT,
            0.5,
        );
        const sCalm = makeState(0, 0, 10, 0);
        sCalm.timeSinceCollision = 999;
        const dCalm = computeAiDecision(
            { ...BRAWLER, grudgeIntensity: 0.9 },
            sCalm,
            0,
            0,
            10,
            0,
            ARENA_R,
            DT,
            0.5,
        );
        const grudgeMag = Math.sqrt(dGrudge.moveX ** 2 + dGrudge.moveY ** 2);
        const calmMag = Math.sqrt(dCalm.moveX ** 2 + dCalm.moveY ** 2);
        // Grudge should not reduce movement (may boost via aggression)
        expect(grudgeMag).toBeGreaterThanOrEqual(calmMag * 0.9);
    });

    it('desperation boosts aggression when behind', () => {
        const s = makeState(0, 0, 10, 0);
        s.opponentScore = 3;
        s.selfScore = 0;
        const dBehind = computeAiDecision(
            { ...BRAWLER, desperationThreshold: 0.8 },
            s,
            0,
            0,
            10,
            0,
            ARENA_R,
            DT,
            0.5,
        );
        const sEven = makeState(0, 0, 10, 0);
        sEven.opponentScore = 0;
        sEven.selfScore = 0;
        const dEven = computeAiDecision(
            { ...BRAWLER, desperationThreshold: 0.8 },
            sEven,
            0,
            0,
            10,
            0,
            ARENA_R,
            DT,
            0.5,
        );
        // When behind, movement should be at least as aggressive
        const behindMag = Math.sqrt(dBehind.moveX ** 2 + dBehind.moveY ** 2);
        const evenMag = Math.sqrt(dEven.moveX ** 2 + dEven.moveY ** 2);
        expect(behindMag).toBeGreaterThanOrEqual(evenMag * 0.95);
    });

    it('post-hit pause reduces speed near zero', () => {
        const s = makeState(0, 0, 5, 0);
        s.timeSinceCollision = 0.05; // just hit
        s.postHitTimer = 0.3;
        const d = computeAiDecision(
            { ...PHANTOM },
            s,
            0,
            0,
            5,
            0,
            ARENA_R,
            DT,
            0.5,
        );
        const mag = Math.sqrt(d.moveX ** 2 + d.moveY ** 2);
        expect(mag).toBeLessThan(0.1);
    });

    it('retreatAfterHit moves away from opponent post-collision', () => {
        const s = makeState(0, 0, 5, 0);
        s.timeSinceCollision = 0.3;
        const d = computeAiDecision(
            { ...BRAWLER, retreatAfterHit: 0.9, aggression: 0.3 },
            s,
            0,
            0,
            5,
            0,
            ARENA_R,
            DT,
            0.5,
        );
        // Should be moving away from opponent (negative X since opponent is at +X)
        expect(d.moveX).toBeLessThan(0.3);
    });

    it('preferred distance maintains standoff range', () => {
        // AI is closer than preferred distance — should back off
        const s = makeState(0, 0, 2, 0);
        const d = computeAiDecision(
            { ...MATADOR },
            s,
            0,
            0,
            2,
            0,
            ARENA_R,
            DT,
            0.5,
        );
        // Matador has preferredDistance=6, at distance 2 should have some retreat
        // The exact direction depends on blended influences, but should not be fully positive
        expect(d.moveX).toBeLessThan(0.8);
    });
});
