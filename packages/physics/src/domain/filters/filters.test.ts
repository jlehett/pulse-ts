import {
    layer,
    layers,
    shouldCollide,
    setLayer,
    setMask,
    addToMask,
    collideWithAll,
    collideWithNone,
} from './filters';

describe('filter helpers', () => {
    it('layer and layers produce bitmasks', () => {
        expect(layer(0)).toBe(1);
        expect(layer(1)).toBe(2);
        expect(layers(0, 2, 4)).toBe(layer(0) | layer(2) | layer(4));
    });

    it('setLayer/setMask/addToMask modify collider fields and shouldCollide honors them', () => {
        const a: any = { layer: 0, mask: 0 };
        const b: any = { layer: 0, mask: 0 };
        setLayer(a, 1); // layer index 1 -> bit 2
        setLayer(b, 2); // bit 4
        setMask(a, 1); // only bit 2
        expect(shouldCollide(a, b)).toBe(false);
        addToMask(a, 2);
        collideWithAll(b);
        expect(shouldCollide(a, b)).toBe(true);
        collideWithNone(a);
        expect(shouldCollide(a, b)).toBe(false);
    });
});
