import {
    BRAWLER,
    SENTINEL,
    GREMLIN,
    MATADOR,
    JUGGERNAUT,
    PHANTOM,
    PUPPETEER,
    MIMIC,
    BERSERKER,
    CYCLONE,
    SHOWBOAT,
    VIPER,
    TRICKSTER,
    PENDULUM,
    WARDEN,
    AI_PERSONALITIES,
    type AiPersonality,
} from './personalities';

const ALL_PRESETS: [string, AiPersonality][] = AI_PERSONALITIES.map((p) => [
    p.name,
    p,
]);

describe('AiPersonality interface', () => {
    it.each(ALL_PRESETS)(
        '%s has all required core fields',
        (_name, personality) => {
            expect(typeof personality.name).toBe('string');
            expect(personality.name.length).toBeGreaterThan(0);
            expect(typeof personality.color).toBe('number');
            expect(typeof personality.tagline).toBe('string');
            expect(personality.tagline.length).toBeGreaterThan(0);
            expect(typeof personality.approachDistance).toBe('number');
            expect(typeof personality.aggression).toBe('number');
            expect(typeof personality.edgeCaution).toBe('number');
            expect(typeof personality.dashRate).toBe('number');
            expect(typeof personality.erraticism).toBe('number');
            expect(typeof personality.moveSpeed).toBe('number');
        },
    );

    it.each(ALL_PRESETS)('%s has a valid hex color', (_name, personality) => {
        expect(personality.color).toBeGreaterThanOrEqual(0);
        expect(personality.color).toBeLessThanOrEqual(0xffffff);
    });

    it.each(ALL_PRESETS)('%s has core values in valid ranges', (_name, p) => {
        expect(p.approachDistance).toBeGreaterThan(0);
        expect(p.aggression).toBeGreaterThanOrEqual(0);
        expect(p.aggression).toBeLessThanOrEqual(1);
        expect(p.edgeCaution).toBeGreaterThanOrEqual(0);
        expect(p.edgeCaution).toBeLessThanOrEqual(1);
        expect(p.dashRate).toBeGreaterThanOrEqual(0);
        expect(p.erraticism).toBeGreaterThanOrEqual(0);
        expect(p.erraticism).toBeLessThanOrEqual(1);
        expect(p.moveSpeed).toBeGreaterThan(0);
        expect(p.moveSpeed).toBeLessThanOrEqual(1);
    });
});

describe('personality differentiation', () => {
    it('Brawler is more aggressive than Sentinel', () => {
        expect(BRAWLER.aggression).toBeGreaterThan(SENTINEL.aggression);
    });

    it('Sentinel has higher edge caution than Brawler', () => {
        expect(SENTINEL.edgeCaution).toBeGreaterThan(BRAWLER.edgeCaution);
    });

    it('Gremlin has highest erraticism among originals', () => {
        expect(GREMLIN.erraticism).toBeGreaterThan(BRAWLER.erraticism);
        expect(GREMLIN.erraticism).toBeGreaterThan(SENTINEL.erraticism);
    });

    it('Brawler dashes most frequently among originals', () => {
        expect(BRAWLER.dashRate).toBeGreaterThan(SENTINEL.dashRate);
        expect(BRAWLER.dashRate).toBeGreaterThan(GREMLIN.dashRate);
    });

    it('Matador has high strafe and dodge', () => {
        expect(MATADOR.strafeStrength).toBeGreaterThan(0.5);
        expect(MATADOR.dodgeReflex).toBeGreaterThan(0.5);
    });

    it('Juggernaut has high momentum commitment', () => {
        expect(JUGGERNAUT.momentumCommitment).toBeGreaterThanOrEqual(0.5);
    });

    it('Phantom has high ambush tendency', () => {
        expect(PHANTOM.ambushTendency).toBeGreaterThan(0.5);
    });

    it('Puppeteer has high herding', () => {
        expect(PUPPETEER.herding).toBeGreaterThan(0.5);
    });

    it('Mimic has high copycat and mirror tendency', () => {
        expect(MIMIC.copycat).toBeGreaterThan(0.5);
        expect(MIMIC.mirrorTendency).toBeGreaterThan(0.5);
    });

    it('Berserker has high grudge and sacrificial dash', () => {
        expect(BERSERKER.grudgeIntensity).toBeGreaterThan(0.5);
        expect(BERSERKER.sacrificialDash).toBeGreaterThan(0.5);
    });

    it('Cyclone has high spin rate', () => {
        expect(CYCLONE.spinRate).toBeGreaterThan(0.5);
    });

    it('Showboat has high showboating and overconfidence', () => {
        expect(SHOWBOAT.showboating).toBeGreaterThan(0.5);
        expect(SHOWBOAT.overconfidence).toBeGreaterThan(0.5);
    });

    it('Viper has high angle preference and retreats after hit', () => {
        expect(VIPER.anglePref).toBeGreaterThan(0.5);
        expect(VIPER.retreatAfterHit).toBeGreaterThan(0.5);
    });

    it('Trickster has high feint rate', () => {
        expect(TRICKSTER.feintRate).toBeGreaterThan(0.5);
    });

    it('Pendulum has high phase shift and rhythm period', () => {
        expect(PENDULUM.phaseShift).toBeGreaterThan(0.5);
        expect(PENDULUM.rhythmPeriod).toBeGreaterThan(0);
    });

    it('Warden has high territoriality', () => {
        expect(WARDEN.territoriality).toBeGreaterThan(0.5);
    });
});

describe('AI_PERSONALITIES', () => {
    it('contains all fifteen personalities', () => {
        expect(AI_PERSONALITIES).toHaveLength(15);
        expect(AI_PERSONALITIES).toContain(BRAWLER);
        expect(AI_PERSONALITIES).toContain(SENTINEL);
        expect(AI_PERSONALITIES).toContain(GREMLIN);
        expect(AI_PERSONALITIES).toContain(MATADOR);
        expect(AI_PERSONALITIES).toContain(JUGGERNAUT);
        expect(AI_PERSONALITIES).toContain(PHANTOM);
        expect(AI_PERSONALITIES).toContain(PUPPETEER);
        expect(AI_PERSONALITIES).toContain(MIMIC);
        expect(AI_PERSONALITIES).toContain(BERSERKER);
        expect(AI_PERSONALITIES).toContain(CYCLONE);
        expect(AI_PERSONALITIES).toContain(SHOWBOAT);
        expect(AI_PERSONALITIES).toContain(VIPER);
        expect(AI_PERSONALITIES).toContain(TRICKSTER);
        expect(AI_PERSONALITIES).toContain(PENDULUM);
        expect(AI_PERSONALITIES).toContain(WARDEN);
    });

    it('has unique names', () => {
        const names = AI_PERSONALITIES.map((p) => p.name);
        expect(new Set(names).size).toBe(names.length);
    });
});
