import {
    KnockoutChannel,
    CountdownStartChannel,
    CountdownAckChannel,
    ScoringOutcomeChannel,
    RematchChannel,
    type ScoringOutcome,
    type RematchMessage,
} from './channels';

describe('channels', () => {
    it('exports KnockoutChannel with name "knockout"', () => {
        expect(KnockoutChannel.name).toBe('knockout');
    });

    it('exports CountdownStartChannel with name "countdown-start"', () => {
        expect(CountdownStartChannel.name).toBe('countdown-start');
    });

    it('exports CountdownAckChannel with name "countdown-ack"', () => {
        expect(CountdownAckChannel.name).toBe('countdown-ack');
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

    it('exports RematchChannel with name "rematch"', () => {
        expect(RematchChannel.name).toBe('rematch');
    });

    it('RematchMessage interface accepts offer, accept, and decline types', () => {
        const offer: RematchMessage = { type: 'offer' };
        const accept: RematchMessage = { type: 'accept' };
        const decline: RematchMessage = { type: 'decline' };
        expect(offer.type).toBe('offer');
        expect(accept.type).toBe('accept');
        expect(decline.type).toBe('decline');
    });
});
