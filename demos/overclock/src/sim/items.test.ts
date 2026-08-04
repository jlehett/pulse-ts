import { aggregateItemStats, hasItemEffect, itemsFor } from './items';

describe('itemsFor', () => {
    it('resolves ids and throws on unknown ids', () => {
        expect(itemsFor(['cell', 'railgunChassis']).map((i) => i.name)).toEqual(
            ['Power Cell', 'Railgun Chassis'],
        );
        expect(() => itemsFor(['bogus'])).toThrow('Unknown item: bogus');
    });
});

describe('aggregateItemStats', () => {
    it('sums flat bonuses across items, defaulting absent stats to 0', () => {
        const agg = aggregateItemStats(itemsFor(['cell', 'hybridActuator']));
        expect(agg.atk).toBe(30);
        expect(agg.ap).toBeCloseTo(0.15);
        expect(agg.hp).toBe(0);
        expect(agg.mana).toBe(0);
    });
});

describe('hasItemEffect', () => {
    it('detects passive effects among equipped items', () => {
        const items = itemsFor(['railgunChassis', 'cell']);
        expect(hasItemEffect(items, 'railgun')).toBe(true);
        expect(hasItemEffect(items, 'gatling')).toBe(false);
    });
});
