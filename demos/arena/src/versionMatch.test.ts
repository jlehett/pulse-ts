/**
 * Tests for version matching logic.
 */

import { versionsMatch } from './versionMatch';

describe('versionsMatch', () => {
    it('returns true for identical versions', () => {
        expect(versionsMatch('abc123', 'abc123')).toBe(true);
    });

    it('returns false for different versions', () => {
        expect(versionsMatch('abc123', 'def456')).toBe(false);
    });

    it('returns true when local version is dev', () => {
        expect(versionsMatch('dev', 'abc123')).toBe(true);
    });

    it('returns true when peer version is dev', () => {
        expect(versionsMatch('abc123', 'dev')).toBe(true);
    });

    it('returns true when both versions are dev', () => {
        expect(versionsMatch('dev', 'dev')).toBe(true);
    });

    it('returns true when peer version is empty (old client)', () => {
        expect(versionsMatch('abc123', '')).toBe(true);
    });

    it('returns true when local version is empty', () => {
        expect(versionsMatch('', 'abc123')).toBe(true);
    });

    it('returns true when both versions are empty', () => {
        expect(versionsMatch('', '')).toBe(true);
    });
});
