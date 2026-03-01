import { useContext, useFixedUpdate, useTimer } from '@pulse-ts/core';
import { useSound } from '@pulse-ts/audio';
import { useChannel } from '@pulse-ts/network';
import { GameCtx } from '../contexts';
import { KnockoutChannel, RoundResetChannel } from '../config/channels';
import {
    WIN_COUNT,
    KO_FLASH_DURATION,
    RESET_PAUSE_DURATION,
    COUNTDOWN_DURATION,
} from '../config/arena';

/**
 * Compute the countdown display value from the remaining countdown time.
 * Maps the 4-second countdown into discrete labels: 3, 2, 1, 0 (GO!).
 *
 * @param remaining - Seconds remaining in the countdown timer.
 * @returns A display value: 3, 2, 1, or 0 (representing "GO!").
 *
 * @example
 * ```ts
 * computeCountdownValue(3.5); // 3
 * computeCountdownValue(2.1); // 2
 * computeCountdownValue(1.0); // 1
 * computeCountdownValue(0.5); // 0  (GO!)
 * computeCountdownValue(0);   // 0  (GO!)
 * ```
 */
export function computeCountdownValue(remaining: number): number {
    if (remaining > 3) return 3;
    if (remaining > 2) return 2;
    if (remaining > 1) return 1;
    return 0; // GO!
}

/**
 * State-machine game manager that drives the round lifecycle:
 * PLAYING → KO_FLASH → RESETTING → COUNTDOWN → PLAYING.
 *
 * Subscribes to knockout events and orchestrates phase transitions
 * using fixed-update timers. Ignores knockouts during non-playing phases.
 */
export function GameManagerNode() {
    const gameState = useContext(GameCtx);

    const koFlashTimer = useTimer(KO_FLASH_DURATION);
    const resetPauseTimer = useTimer(RESET_PAUSE_DURATION);
    const countdownTimer = useTimer(COUNTDOWN_DURATION);

    const countdownBeepSfx = useSound('tone', {
        wave: 'sine',
        frequency: 880,
        duration: 0.1,
        gain: 0.15,
    });
    const countdownGoSfx = useSound('tone', {
        wave: 'sine',
        frequency: 1320,
        duration: 0.15,
        gain: 0.15,
    });
    const koAnnounceSfx = useSound('tone', {
        wave: 'sawtooth',
        frequency: [200, 100],
        duration: 0.4,
        gain: 0.12,
    });
    const matchFanfareSfx = useSound('arpeggio', {
        wave: 'sine',
        notes: [523.25, 659.25, 783.99, 1046.5],
        interval: 0.08,
        duration: 0.4,
        gain: 0.12,
    });

    const roundReset = useChannel(RoundResetChannel);

    useChannel<number>(KnockoutChannel, (knockedOutPlayerId) => {
        // Only score during active play — prevents double-scoring
        if (gameState.phase !== 'playing') return;

        const scorer = 1 - knockedOutPlayerId;
        gameState.scores[scorer]++;
        gameState.lastKnockedOut = knockedOutPlayerId;

        if (gameState.scores[scorer] >= WIN_COUNT) {
            gameState.phase = 'match_over';
            gameState.matchWinner = scorer;
            matchFanfareSfx.play();
        } else {
            gameState.phase = 'ko_flash';
            koFlashTimer.reset();
            koAnnounceSfx.play();
        }
    });

    let prevCountdown = -1;

    useFixedUpdate(() => {
        switch (gameState.phase) {
            case 'ko_flash':
                if (!koFlashTimer.active) {
                    gameState.phase = 'resetting';
                    resetPauseTimer.reset();
                    gameState.round++;
                    roundReset.publish(gameState.round);
                }
                break;

            case 'resetting':
                if (!resetPauseTimer.active) {
                    gameState.phase = 'countdown';
                    countdownTimer.reset();
                    gameState.countdownValue = 3;
                }
                break;

            case 'countdown': {
                if (!countdownTimer.active) {
                    gameState.phase = 'playing';
                    gameState.countdownValue = -1;
                    prevCountdown = -1;
                } else {
                    const value = computeCountdownValue(
                        countdownTimer.remaining,
                    );
                    if (value !== prevCountdown) {
                        if (value > 0) countdownBeepSfx.play();
                        else countdownGoSfx.play();
                        prevCountdown = value;
                    }
                    gameState.countdownValue = value;
                }
                break;
            }

            // 'playing' and 'match_over' — no automatic transitions
            default:
                break;
        }
    });
}
