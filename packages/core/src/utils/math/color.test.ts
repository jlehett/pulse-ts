import { color } from './color';

describe('color', () => {
    const c = color(0x48c9b0);

    test('.num returns the original hex number', () => {
        expect(c.num).toBe(0x48c9b0);
    });

    test('.hex returns a CSS hex string', () => {
        expect(c.hex).toBe('#48c9b0');
    });

    test('.rgb returns a CSS rgb string', () => {
        expect(c.rgb).toBe('rgb(72, 201, 176)');
    });

    test('.rgba(alpha) returns a CSS rgba string', () => {
        expect(c.rgba(0.5)).toBe('rgba(72, 201, 176, 0.5)');
        expect(c.rgba(1)).toBe('rgba(72, 201, 176, 1)');
        expect(c.rgba(0)).toBe('rgba(72, 201, 176, 0)');
    });

    test('.r, .g, .b return 0–255 channel values', () => {
        expect(c.r).toBe(72);
        expect(c.g).toBe(201);
        expect(c.b).toBe(176);
    });

    test('handles black (0x000000)', () => {
        const black = color(0x000000);
        expect(black.hex).toBe('#000000');
        expect(black.rgb).toBe('rgb(0, 0, 0)');
        expect(black.r).toBe(0);
        expect(black.g).toBe(0);
        expect(black.b).toBe(0);
    });

    test('handles white (0xffffff)', () => {
        const white = color(0xffffff);
        expect(white.hex).toBe('#ffffff');
        expect(white.rgb).toBe('rgb(255, 255, 255)');
        expect(white.r).toBe(255);
        expect(white.g).toBe(255);
        expect(white.b).toBe(255);
    });

    test('handles colors with leading zeros (0x00ff00)', () => {
        const green = color(0x00ff00);
        expect(green.hex).toBe('#00ff00');
        expect(green.r).toBe(0);
        expect(green.g).toBe(255);
        expect(green.b).toBe(0);
    });

    test('handles pure red (0xff0000)', () => {
        const red = color(0xff0000);
        expect(red.hex).toBe('#ff0000');
        expect(red.r).toBe(255);
        expect(red.g).toBe(0);
        expect(red.b).toBe(0);
    });
});
