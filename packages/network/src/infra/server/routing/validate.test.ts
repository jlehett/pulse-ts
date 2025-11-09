import { validateWithZod } from './validate';

describe('validateWithZod', () => {
    it('wraps a zod-like schema', () => {
        const schema = {
            safeParse: (d: any) => ({ success: d && d.ok === true }),
        };
        const validate = validateWithZod(schema);
        expect(validate({ ok: true })).toBe(true);
        expect(validate({ ok: false })).toBe(false);
    });
});
