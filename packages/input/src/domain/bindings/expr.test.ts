import { Axis1D, Axis2D, Key } from './expr';

describe('expr helpers', () => {
    test('Key normalizes single letters and digits', () => {
        expect(Key('w').code).toBe('KeyW');
        expect(Key('5').code).toBe('Digit5');
        expect(Key('Space').code).toBe('Space');
    });

    test('Axis1D scale applies', () => {
        const a = Axis1D({ pos: Key('D'), neg: Key('A'), scale: 2 });
        expect(a.scale).toBe(2);
        expect(a.pos[0].code).toBe('KeyD');
        expect(a.neg[0].code).toBe('KeyA');
    });

    test('Axis2D carries invert flags', () => {
        const a2 = Axis2D({
            x: { pos: Key('D'), neg: Key('A') },
            y: { pos: Key('W'), neg: Key('S') },
        });
        // invert flags undefined by default
        expect((a2 as any).invertX).toBeUndefined();
        expect((a2 as any).invertY).toBeUndefined();
    });
});

