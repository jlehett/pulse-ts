import { MODEL_TARGET_HEIGHT, fitTransform } from './modelFit';

describe('fitTransform', () => {
    it('scales a model to the standard construct height', () => {
        const fit = fitTransform(
            { min: { x: -1, y: 0, z: -1 }, max: { x: 1, y: 2, z: 1 } },
            {},
        );
        expect(fit.scale).toBeCloseTo(MODEL_TARGET_HEIGHT / 2);
        expect(fit.position.x).toBeCloseTo(0);
        expect(fit.position.y).toBeCloseTo(0);
        expect(fit.position.z).toBeCloseTo(0);
    });

    it('centers on x/z and grounds the lowest point', () => {
        const fit = fitTransform(
            { min: { x: 2, y: -0.5, z: 4 }, max: { x: 6, y: 1.1, z: 8 } },
            {},
        );
        // Height 1.6 already matches the target, so scale is 1.
        expect(fit.scale).toBeCloseTo(1);
        expect(fit.position.x).toBeCloseTo(-4); // center x was 4
        expect(fit.position.z).toBeCloseTo(-6); // center z was 6
        expect(fit.position.y).toBeCloseTo(0.5); // lifts min.y to 0
    });

    it('applies the user scale multiplier and yOffset after fitting', () => {
        const fit = fitTransform(
            { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 3.2, z: 1 } },
            { scale: 2, yOffset: 0.25 },
        );
        expect(fit.scale).toBeCloseTo(1); // (1.6 / 3.2) * 2
        expect(fit.position.x).toBeCloseTo(-0.5);
        expect(fit.position.y).toBeCloseTo(0.25);
    });

    it('falls back to the user scale for degenerate flat boxes', () => {
        const fit = fitTransform(
            { min: { x: 0, y: 1, z: 0 }, max: { x: 1, y: 1, z: 1 } },
            { scale: 0.5 },
        );
        expect(fit.scale).toBeCloseTo(0.5);
    });
});
