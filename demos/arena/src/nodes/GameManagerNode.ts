import {
    useContext,
    useFixedUpdate,
    useFixedLate,
    useTimer,
} from '@pulse-ts/core';
import { useSound } from '@pulse-ts/audio';
import { useChannel } from '@pulse-ts/network';
import { GameCtx } from '../contexts';
import {
    WIN_COUNT,
    KO_FLASH_DURATION,
    RESET_PAUSE_DURATION,
    COUNTDOWN_DURATION,
    TIE_WINDOW_FRAMES,
} from '../config/arena';
import {
    KnockoutChannel,
    RoundResetChannel,
    ScoringOutcomeChannel,
    type ScoringOutcome,
} from '../config/channels';
import {
    startReplay,
    isReplayActive,
    endReplay,
    commitFrame,
    clearRecording,
} from '../replay';

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

export interface GameManagerNodeProps {
    /** When true, subscribes to the knockout channel for remote events
     *  and skips the paused guard (online mode cannot freeze the game). */
    online?: boolean;
    /** Whether the local machine is the host in online mode. The host
     *  broadcasts the "go" signal when the countdown ends; the non-host
     *  waits for it before transitioning to `playing`. */
    isHost?: boolean;
}

/**
 * State-machine game manager that drives the round lifecycle:
 * PLAYING → REPLAY → KO_FLASH → RESETTING → COUNTDOWN → PLAYING.
 *
 * When a knockout is detected, an instant replay plays back the last
 * few seconds before proceeding with the score update and KO flash.
 * Also commits player positions into the replay ring buffer each
 * fixed step via `useFixedLate`.
 *
 * @param props - Optional configuration for online mode.
 */
export function GameManagerNode(props?: Readonly<GameManagerNodeProps>) {
    const gameState = useContext(GameCtx);

    // In online mode, receive knockout events from the remote machine
    // and synchronize countdown→playing transition via RoundResetChannel.
    // The host also broadcasts authoritative scoring outcomes.
    let publishRoundReset: ((round: number) => void) | null = null;
    let publishScoringOutcome: ((outcome: ScoringOutcome) => void) | null =
        null;
    let hostCountdownDone = false;

    /** Set by the non-host when receiving the host's authoritative scoring. */
    let receivedOutcome: ScoringOutcome | null = null;

    if (props?.online) {
        useChannel(KnockoutChannel, (knockedOutPlayerId) => {
            // Use pendingKnockout2 if the first slot is already occupied
            if (gameState.pendingKnockout >= 0) {
                gameState.pendingKnockout2 = knockedOutPlayerId;
            } else {
                gameState.pendingKnockout = knockedOutPlayerId;
            }
        });

        const rc = useChannel(RoundResetChannel, () => {
            // Non-host: the host says "go" — we can transition to playing
            hostCountdownDone = true;
        });
        publishRoundReset = (round) => rc.publish(round);

        // Scoring outcome channel — host publishes, non-host subscribes
        const sc = useChannel(ScoringOutcomeChannel, (outcome) => {
            if (!props?.isHost) {
                receivedOutcome = outcome;
            }
        });
        if (props?.isHost) {
            publishScoringOutcome = (outcome) => sc.publish(outcome);
        }
    }

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

    let prevCountdown = -1;

    /**
     * Apply a scoring outcome — increment the scorer's score (if not a tie)
     * and transition to `ko_flash` or `match_over`.
     *
     * @param scorer - Player ID who scored (0 or 1), or -1 for a tie.
     * @param isTie - Whether the round ended in a tie.
     */
    function applyScoring(scorer: number, isTie: boolean): void {
        if (!isTie && scorer >= 0) {
            gameState.scores[scorer]++;

            if (gameState.scores[scorer] >= WIN_COUNT) {
                gameState.phase = 'match_over';
                gameState.matchWinner = scorer;
                matchFanfareSfx.play();
                return;
            }
        }

        gameState.phase = 'ko_flash';
        koFlashTimer.reset();
        koAnnounceSfx.play();
    }

    /** Countdown for the tie detection window (-1 = inactive). */
    let tieWindowCounter = -1;

    /** Player ID stored from the first knockout while the tie window is open. */
    let firstKnockedOut = -1;

    useFixedUpdate(() => {
        // In online mode, pause is overlay-only — never freeze the state machine
        if (!props?.online && gameState.paused) return;

        // --- Tie window knockout detection ---
        // When the first knockout arrives during 'playing', open a tie window
        // instead of immediately starting the replay.
        if (gameState.pendingKnockout >= 0 && gameState.phase === 'playing') {
            if (tieWindowCounter < 0) {
                // First knockout — open the tie window
                firstKnockedOut = gameState.pendingKnockout;
                gameState.pendingKnockout = -1;
                tieWindowCounter = TIE_WINDOW_FRAMES;

                // Check if a second knockout already arrived in the same frame
                if (gameState.pendingKnockout2 >= 0) {
                    // Both fell in the same frame — immediate tie
                    gameState.isTie = true;
                    gameState.lastKnockedOut = firstKnockedOut;
                    gameState.pendingKnockout2 = -1;
                    tieWindowCounter = -1;
                    startReplay(firstKnockedOut);
                    gameState.phase = 'replay';
                }
            }
        }

        // Tick the tie window countdown
        if (tieWindowCounter > 0 && gameState.phase === 'playing') {
            tieWindowCounter--;

            // Check for a second knockout arriving during the window
            if (
                gameState.pendingKnockout >= 0 ||
                gameState.pendingKnockout2 >= 0
            ) {
                // Second knockout arrived — tie!
                gameState.isTie = true;
                gameState.lastKnockedOut = firstKnockedOut;
                gameState.pendingKnockout = -1;
                gameState.pendingKnockout2 = -1;
                tieWindowCounter = -1;
                startReplay(firstKnockedOut);
                gameState.phase = 'replay';
            } else if (tieWindowCounter === 0) {
                // Window expired with only one knockout — normal scoring
                gameState.isTie = false;
                gameState.lastKnockedOut = firstKnockedOut;
                tieWindowCounter = -1;
                startReplay(firstKnockedOut);
                gameState.phase = 'replay';
            }
        }

        switch (gameState.phase) {
            case 'replay': {
                if (!isReplayActive()) {
                    const isNonHostOnline = props?.online && !props?.isHost;

                    // Non-host: wait for the host's outcome before proceeding
                    if (isNonHostOnline && !receivedOutcome) {
                        break;
                    }

                    endReplay();

                    if (isNonHostOnline && receivedOutcome) {
                        // Apply the host's authoritative decision
                        gameState.isTie = receivedOutcome.isTie;
                        applyScoring(
                            receivedOutcome.scorer,
                            receivedOutcome.isTie,
                        );
                        receivedOutcome = null;
                    } else {
                        // Local mode or host: compute scoring locally
                        const scorer = gameState.isTie
                            ? -1
                            : 1 - gameState.lastKnockedOut;
                        applyScoring(scorer, gameState.isTie);

                        // Host: broadcast the outcome to non-host
                        if (publishScoringOutcome) {
                            publishScoringOutcome({
                                scorer,
                                isTie: gameState.isTie,
                            });
                        }
                    }
                }
                break;
            }

            case 'ko_flash':
                if (!koFlashTimer.active) {
                    gameState.phase = 'resetting';
                    resetPauseTimer.reset();
                    gameState.round++;
                    // Reset tie state for the next round
                    gameState.isTie = false;
                    gameState.pendingKnockout2 = -1;
                    firstKnockedOut = -1;
                    // Clear recorded footage so next replay only shows the new round
                    clearRecording();
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
                const isNonHost = props?.online && !props?.isHost;

                // Check if we should transition to playing:
                // - Local mode or host: when local countdown expires
                // - Non-host: when local countdown expires AND host signal received
                //   OR when host signal arrives before local countdown (snap to playing)
                const localDone = !countdownTimer.active;
                const canTransition = localDone
                    ? !isNonHost || hostCountdownDone
                    : isNonHost && hostCountdownDone;

                if (canTransition) {
                    gameState.phase = 'playing';
                    gameState.countdownValue = -1;
                    prevCountdown = -1;
                    hostCountdownDone = false;

                    // Host: broadcast "go" signal so non-host can transition
                    if (props?.online && props?.isHost) {
                        publishRoundReset!(gameState.round);
                    }
                } else {
                    const value = localDone
                        ? 0 // non-host waiting for host — hold on "GO!"
                        : computeCountdownValue(countdownTimer.remaining);
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

    // Commit staged player positions into the replay ring buffer.
    // Runs after all useFixedUpdate callbacks so both players have staged.
    useFixedLate(() => {
        if (gameState.phase === 'playing') {
            commitFrame();
        }
    });
}
