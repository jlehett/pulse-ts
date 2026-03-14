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

    test('Axis2D.keys creates a 2D axis from four key codes', () => {
        const a = Axis2D.keys('KeyJ', 'KeyL', 'KeyK', 'KeyI');
        expect(a.type).toBe('axis2d');
        expect(a.axes['x'].neg[0].code).toBe('KeyJ');
        expect(a.axes['x'].pos[0].code).toBe('KeyL');
        expect(a.axes['y'].neg[0].code).toBe('KeyK');
        expect(a.axes['y'].pos[0].code).toBe('KeyI');
    });

    test('Axis2D.keys normalizes shorthand key codes', () => {
        const a = Axis2D.keys('a', 'd', 's', 'w');
        expect(a.axes['x'].neg[0].code).toBe('KeyA');
        expect(a.axes['x'].pos[0].code).toBe('KeyD');
        expect(a.axes['y'].neg[0].code).toBe('KeyS');
        expect(a.axes['y'].pos[0].code).toBe('KeyW');
    });

    test('Axis2D.wasd creates WASD bindings', () => {
        const a = Axis2D.wasd();
        expect(a.type).toBe('axis2d');
        expect(a.axes['x'].neg[0].code).toBe('KeyA');
        expect(a.axes['x'].pos[0].code).toBe('KeyD');
        expect(a.axes['y'].neg[0].code).toBe('KeyS');
        expect(a.axes['y'].pos[0].code).toBe('KeyW');
    });

    test('Axis2D.arrows creates arrow key bindings', () => {
        const a = Axis2D.arrows();
        expect(a.type).toBe('axis2d');
        expect(a.axes['x'].neg[0].code).toBe('ArrowLeft');
        expect(a.axes['x'].pos[0].code).toBe('ArrowRight');
        expect(a.axes['y'].neg[0].code).toBe('ArrowDown');
        expect(a.axes['y'].pos[0].code).toBe('ArrowUp');
    });

    test('Axis2D.wasd produces same result as manual construction', () => {
        const shorthand = Axis2D.wasd();
        const manual = Axis2D({
            x: { neg: Key('KeyA'), pos: Key('KeyD') },
            y: { neg: Key('KeyS'), pos: Key('KeyW') },
        });
        expect(shorthand).toEqual(manual);
    });

    test('Axis2D full form still works alongside shorthands', () => {
        const full = Axis2D({
            x: { pos: Key('D'), neg: Key('A'), scale: 2 },
            y: { pos: Key('W'), neg: Key('S') },
        });
        expect(full.type).toBe('axis2d');
        expect(full.axes['x'].scale).toBe(2);
    });
});
