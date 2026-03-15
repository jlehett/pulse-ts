import {
    useContext,
    useFixedUpdate,
    useFixedLate,
    useTimer,
    useStore,
} from '@pulse-ts/core';
import { useSound, useSoundGroup } from '@pulse-ts/audio';
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
    CountdownStartChannel,
    CountdownAckChannel,
    ScoringOutcomeChannel,
    type ScoringOutcome,
} from '../config/channels';
import {
    ReplayStore,
    startReplay,
    endReplay,
    commitFrame,
    clearRecording,
} from '../replay';
import { DashCooldownStore } from '../dashCooldown';
import { KnockoutQueueStore } from '../knockoutQueue';
import { useHitImpactPool } from '../hitImpact';
import { resetCameraShake } from './CameraRigNode';
import { PlayerVelocityStore } from '../playerVelocity';

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
 * PLAYING -> REPLAY -> KO_FLASH -> RESETTING -> COUNTDOWN -> PLAYING.
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

    // World-scoped stores — auto-reset on world.destroy()
    const [replay] = useStore(ReplayStore);
    const [cooldown] = useStore(DashCooldownStore);
    const hitImpactPool = useHitImpactPool();
    const [velocities] = useStore(PlayerVelocityStore);
    const [ko] = useStore(KnockoutQueueStore);

    // Clear non-store module state from any previous game session.
    clearRecording(replay);
    endReplay(replay);
    resetCameraShake();

    // Store state is already fresh from world-scoped initialization,
    // but explicit reset ensures clean state if the node is re-mounted
    // within the same world.
    cooldown.progress[0] = 1;
    cooldown.progress[1] = 1;
    hitImpactPool.reset();
    for (const s of velocities.states) {
        s.prevX = s.prevZ = s.vx = s.vz = 0;
    }

    // In online mode, receive knockout events from the remote machine
    // and synchronize countdown start via a RTT-compensated handshake:
    //   1. Host sends countdown-start, records timestamp
    //   2. Non-host receives it, starts its timer, sends countdown-ack
    //   3. Host receives ack, measures RTT, starts its timer fast-forwarded
    //      by RTT/2 so both timers expire at the same absolute moment
    let publishCountdownStart: ((round: number) => void) | null = null;
    let publishCountdownAck: ((round: number) => void) | null = null;
    let publishScoringOutcome: ((outcome: ScoringOutcome) => void) | null =
        null;

    /** Non-host: set when the host signals to start the countdown timer. */
    let hostCountdownStarted = false;

    /** Host: timestamp when countdown-start was sent (for RTT measurement). */
    let countdownStartSentAt = 0;

    /** Host: set when the ack arrives; holds the RTT/2 fast-forward amount. */
    let countdownFastForward = 0;
    let hostAckReceived = false;

    /** Set by the non-host when receiving the host's authoritative scoring. */
    let receivedOutcome: ScoringOutcome | null = null;

    if (props?.online) {
        useChannel(KnockoutChannel, (knockedOutPlayerId) => {
            // Use pending2 if the first slot is already occupied
            if (ko.pending >= 0) {
                ko.pending2 = knockedOutPlayerId;
            } else {
                ko.pending = knockedOutPlayerId;
            }
        });

        // Countdown sync channels
        const cs = useChannel(CountdownStartChannel, (round) => {
            // Non-host: start timer immediately and ack
            if (!props?.isHost) {
                hostCountdownStarted = true;
                publishCountdownAck!(round);
            }
        });
        publishCountdownStart = (round) => cs.publish(round);

        const ca = useChannel(CountdownAckChannel, () => {
            // Host: ack received — measure RTT and compute fast-forward
            if (props?.isHost && countdownStartSentAt > 0) {
                const rtt = performance.now() - countdownStartSentAt;
                countdownFastForward = rtt / 2 / 1000; // convert ms to seconds
                hostAckReceived = true;
                countdownStartSentAt = 0;
            }
        });
        publishCountdownAck = (round) => ca.publish(round);

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

    // Sound mixing group for all game manager SFX
    useSoundGroup('sfx');

    const countdownBeepSfx = useSound('tone', {
        wave: 'sine',
        frequency: 880,
        duration: 0.1,
        gain: 0.15,
        group: 'sfx',
    });
    const countdownGoSfx = useSound('tone', {
        wave: 'sine',
        frequency: 1320,
        duration: 0.15,
        gain: 0.15,
        group: 'sfx',
    });
    const koAnnounceSfx = useSound('tone', {
        wave: 'sawtooth',
        frequency: [200, 100],
        duration: 0.4,
        gain: 0.12,
        group: 'sfx',
    });
    const matchFanfareSfx = useSound('arpeggio', {
        wave: 'sine',
        notes: [523.25, 659.25, 783.99, 1046.5],
        interval: 0.08,
        duration: 0.4,
        gain: 0.12,
        group: 'sfx',
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
        // --- Tie window knockout detection ---
        if (ko.pending >= 0 && gameState.phase === 'playing') {
            if (tieWindowCounter < 0) {
                firstKnockedOut = ko.pending;
                ko.pending = -1;
                tieWindowCounter = TIE_WINDOW_FRAMES;

                if (ko.pending2 >= 0) {
                    gameState.isTie = true;
                    gameState.lastKnockedOut = firstKnockedOut;
                    ko.pending2 = -1;
                    tieWindowCounter = -1;
                    startReplay(replay, firstKnockedOut);
                    gameState.phase = 'replay';
                }
            }
        }

        // Tick the tie window countdown
        if (tieWindowCounter > 0 && gameState.phase === 'playing') {
            tieWindowCounter--;

            if (ko.pending >= 0 || ko.pending2 >= 0) {
                gameState.isTie = true;
                gameState.lastKnockedOut = firstKnockedOut;
                ko.pending = -1;
                ko.pending2 = -1;
                tieWindowCounter = -1;
                startReplay(replay, firstKnockedOut);
                gameState.phase = 'replay';
            } else if (tieWindowCounter === 0) {
                gameState.isTie = false;
                gameState.lastKnockedOut = firstKnockedOut;
                tieWindowCounter = -1;
                startReplay(replay, firstKnockedOut);
                gameState.phase = 'replay';
            }
        }

        switch (gameState.phase) {
            case 'replay': {
                if (!replay.active) {
                    const isNonHostOnline = props?.online && !props?.isHost;

                    if (isNonHostOnline && !receivedOutcome) {
                        break;
                    }

                    endReplay(replay);
                    gameState.round++;

                    if (isNonHostOnline && receivedOutcome) {
                        gameState.isTie = receivedOutcome.isTie;
                        applyScoring(
                            receivedOutcome.scorer,
                            receivedOutcome.isTie,
                        );
                        receivedOutcome = null;
                    } else {
                        const scorer = gameState.isTie
                            ? -1
                            : 1 - gameState.lastKnockedOut;
                        applyScoring(scorer, gameState.isTie);

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
                    gameState.isTie = false;
                    ko.pending2 = -1;
                    firstKnockedOut = -1;
                    clearRecording(replay);
                }
                break;

            case 'resetting':
                if (!resetPauseTimer.active) {
                    gameState.phase = 'countdown';
                }
                break;

            case 'countdown': {
                const isNonHost = props?.online && !props?.isHost;
                const isHost = props?.online && props?.isHost;

                if (!countdownTimer.active && gameState.countdownValue < 0) {
                    if (isNonHost) {
                        if (hostCountdownStarted) {
                            countdownTimer.reset();
                            gameState.countdownValue = 3;
                            hostCountdownStarted = false;
                        }
                    } else if (isHost) {
                        if (countdownStartSentAt === 0 && !hostAckReceived) {
                            countdownStartSentAt = performance.now();
                            publishCountdownStart!(gameState.round);
                        } else if (hostAckReceived) {
                            countdownTimer.reset();
                            gameState.countdownValue = 3;
                            hostAckReceived = false;
                        }
                    } else {
                        countdownTimer.reset();
                        gameState.countdownValue = 3;
                    }
                }

                if (countdownTimer.active || gameState.countdownValue >= 0) {
                    const effectiveRemaining =
                        countdownTimer.remaining - countdownFastForward;

                    if (!countdownTimer.active || effectiveRemaining <= 0) {
                        gameState.phase = 'playing';
                        gameState.countdownValue = -1;
                        prevCountdown = -1;
                        countdownFastForward = 0;
                    } else {
                        const value = computeCountdownValue(effectiveRemaining);
                        if (value !== prevCountdown) {
                            if (value > 0) countdownBeepSfx.play();
                            else countdownGoSfx.play();
                            prevCountdown = value;
                        }
                        gameState.countdownValue = value;
                    }
                }
                break;
            }

            default:
                break;
        }
    });

    // Commit staged player positions into the replay ring buffer.
    useFixedLate(() => {
        if (gameState.phase === 'playing') {
            commitFrame(replay);
        }
    });
}
