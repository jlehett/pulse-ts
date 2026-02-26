import { resetActiveCheckpoint } from './CheckpointNode';

describe('CheckpointNode', () => {
    describe('resetActiveCheckpoint', () => {
        it('does not throw when called with no active checkpoint', () => {
            expect(() => resetActiveCheckpoint()).not.toThrow();
        });

        it('can be called multiple times safely', () => {
            resetActiveCheckpoint();
            resetActiveCheckpoint();
            // No error — idempotent
        });
    });
});
