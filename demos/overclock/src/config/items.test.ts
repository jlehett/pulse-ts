import {
    COMBINED_ITEMS,
    COMPONENTS,
    ITEM_BY_ID,
    combineItems,
    isComponent,
} from './items';

describe('item catalog', () => {
    it('has 6 components and 21 combined items with unique ids', () => {
        expect(COMPONENTS).toHaveLength(6);
        expect(COMBINED_ITEMS).toHaveLength(21);
        expect(ITEM_BY_ID.size).toBe(27);
    });

    it('maps every unordered component pair to exactly one combined item', () => {
        const seen = new Set<string>();
        for (let i = 0; i < COMPONENTS.length; i++) {
            for (let j = i; j < COMPONENTS.length; j++) {
                const combined = combineItems(
                    COMPONENTS[i].id,
                    COMPONENTS[j].id,
                );
                expect(combined).not.toBeNull();
                seen.add(combined!.id);
            }
        }
        expect(seen.size).toBe(COMBINED_ITEMS.length);
    });

    it('every combined item has a two-component recipe and an effect', () => {
        for (const item of COMBINED_ITEMS) {
            expect(item.recipe).toHaveLength(2);
            for (const id of item.recipe!) expect(isComponent(id)).toBe(true);
            expect(item.effect).toBeTruthy();
        }
    });

    it('combineItems is order-insensitive and rejects non-components', () => {
        expect(combineItems('core', 'cell')).toBe(combineItems('cell', 'core'));
        expect(combineItems('cell', 'railgunChassis')).toBeNull();
        expect(combineItems('cell', 'nope')).toBeNull();
    });

    it('isComponent distinguishes components from combined items', () => {
        expect(isComponent('cell')).toBe(true);
        expect(isComponent('railgunChassis')).toBe(false);
    });
});
