import {
    KnockoutChannel,
    RoundResetChannel,
    ScoringOutcomeChannel,
    type ScoringOutcome,
} from './channels';

describe('channels', () => {
    it('exports KnockoutChannel with name "knockout"', () => {
        expect(KnockoutChannel.name).toBe('knockout');
    });

    it('exports RoundResetChannel with name "round-reset"', () => {
        expect(RoundResetChannel.name).toBe('round-reset');
    });

    it('exports ScoringOutcomeChannel with name "scoring-outcome"', () => {
        expect(ScoringOutcomeChannel.name).toBe('scoring-outcome');
    });

    it('ScoringOutcome interface accepts scorer and isTie fields', () => {
        const outcome: ScoringOutcome = { scorer: 0, isTie: false };
        expect(outcome.scorer).toBe(0);
        expect(outcome.isTie).toBe(false);
    });

    it('ScoringOutcome with tie has scorer -1', () => {
        const outcome: ScoringOutcome = { scorer: -1, isTie: true };
        expect(outcome.scorer).toBe(-1);
        expect(outcome.isTie).toBe(true);
    });
});
