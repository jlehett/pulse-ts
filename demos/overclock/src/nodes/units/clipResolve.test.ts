import { resolveClipNames } from './clipResolve';

describe('resolveClipNames', () => {
    it('matches common clip names to slots', () => {
        expect(
            resolveClipNames(['Idle', 'Run', 'Punch', 'Spell', 'Die']),
        ).toEqual({
            idle: 'Idle',
            move: 'Run',
            attack: 'Punch',
            cast: 'Spell',
            death: 'Die',
        });
    });

    it('is case-insensitive and tolerates prefixes', () => {
        const out = resolveClipNames(['robot_walk_cycle', 'ATTACK_01']);
        expect(out.move).toBe('robot_walk_cycle');
        expect(out.attack).toBe('ATTACK_01');
    });

    it('prefers explicit overrides over name matching', () => {
        const out = resolveClipNames(['Idle', 'Punch_L', 'Punch_R'], {
            attack: 'Punch_R',
        });
        expect(out.attack).toBe('Punch_R');
    });

    it('ignores overrides naming clips that are not in the file', () => {
        const out = resolveClipNames(['Idle', 'Slash'], {
            attack: 'NotARealClip',
        });
        expect(out.attack).toBe('Slash');
    });

    it('uses the only clip as idle when nothing matches', () => {
        expect(resolveClipNames(['mixamo.com'])).toEqual({
            idle: 'mixamo.com',
        });
    });

    it('returns an empty map for models without animations', () => {
        expect(resolveClipNames([])).toEqual({});
    });
});
