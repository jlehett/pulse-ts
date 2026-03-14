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

    describe('Axis2D.keys', () => {
        test('creates a 2D axis from four key codes (left, right, down, up)', () => {
            const a = Axis2D.keys('KeyJ', 'KeyL', 'KeyK', 'KeyI');
            expect(a.type).toBe('axis2d');
            expect(a.axes.x.neg[0].code).toBe('KeyJ');
            expect(a.axes.x.pos[0].code).toBe('KeyL');
            expect(a.axes.y.neg[0].code).toBe('KeyK');
            expect(a.axes.y.pos[0].code).toBe('KeyI');
        });

        test('normalizes shorthand key codes', () => {
            const a = Axis2D.keys('a', 'd', 's', 'w');
            expect(a.axes.x.neg[0].code).toBe('KeyA');
            expect(a.axes.x.pos[0].code).toBe('KeyD');
            expect(a.axes.y.neg[0].code).toBe('KeyS');
            expect(a.axes.y.pos[0].code).toBe('KeyW');
        });
    });

    describe('Axis2D.wasd', () => {
        test('creates WASD preset with correct key codes', () => {
            const a = Axis2D.wasd();
            expect(a.type).toBe('axis2d');
            expect(a.axes.x.neg[0].code).toBe('KeyA');
            expect(a.axes.x.pos[0].code).toBe('KeyD');
            expect(a.axes.y.neg[0].code).toBe('KeyS');
            expect(a.axes.y.pos[0].code).toBe('KeyW');
        });

        test('returns the same structure as the full form', () => {
            const shorthand = Axis2D.wasd();
            const full = Axis2D({
                x: { neg: Key('KeyA'), pos: Key('KeyD') },
                y: { neg: Key('KeyS'), pos: Key('KeyW') },
            });
            expect(shorthand).toEqual(full);
        });
    });

    describe('Axis2D.arrows', () => {
        test('creates arrow keys preset with correct key codes', () => {
            const a = Axis2D.arrows();
            expect(a.type).toBe('axis2d');
            expect(a.axes.x.neg[0].code).toBe('ArrowLeft');
            expect(a.axes.x.pos[0].code).toBe('ArrowRight');
            expect(a.axes.y.neg[0].code).toBe('ArrowDown');
            expect(a.axes.y.pos[0].code).toBe('ArrowUp');
        });

        test('returns the same structure as the full form', () => {
            const shorthand = Axis2D.arrows();
            const full = Axis2D({
                x: { neg: Key('ArrowLeft'), pos: Key('ArrowRight') },
                y: { neg: Key('ArrowDown'), pos: Key('ArrowUp') },
            });
            expect(shorthand).toEqual(full);
        });
    });

    test('full form Axis2D still works alongside shorthands', () => {
        const full = Axis2D({
            x: { pos: Key('D'), neg: Key('A') },
            y: { pos: Key('W'), neg: Key('S') },
        });
        expect(full.type).toBe('axis2d');
        expect(full.axes.x).toBeDefined();
        expect(full.axes.y).toBeDefined();
    });
});
