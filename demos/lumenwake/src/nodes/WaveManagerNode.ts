import { useFrameUpdate } from '@pulse-ts/core';
import type { EnemyDef } from '../config/enemies';
import type { WaveConfig } from '../config/waves';
import {
    WAVE_CONFIGS,
    TOTAL_WAVES,
    scaleWaveForPlayers,
} from '../config/waves';
import type { GameState } from '../contexts';
import { pickRandomRefractions } from '../config/refractions';

type WavePhase =
    | 'countdown'
    | 'spawning'
    | 'active'
    | 'wave_clear'
    | 'refraction_pick'
    | 'victory'
    | 'defeat';

const COUNTDOWN_DURATION = 3.0;
const WAVE_CLEAR_PAUSE = 3.0;

export interface WaveManagerProps {
    gameState: GameState;
    getAliveEnemyCount: () => number;
    spawnEnemy: (enemyDef: EnemyDef) => void;
    setDarknessLevel: (level: number) => void;
    setSunStrength: (strength: number) => void;
    isPlayerAlive: () => boolean;
    onRefractionPicked?: () => void;
}

/**
 * Drives match progression through 9 waves (8 regular + 1 boss).
 * Controls enemy spawning, darkness levels, and game phase transitions.
 */
export function WaveManagerNode(props: WaveManagerProps) {
    const { gameState } = props;

    let phase: WavePhase = 'countdown';
    let phaseTimer = COUNTDOWN_DURATION;
    let currentWaveIndex = 0;

    let scaledWave: WaveConfig | null = null;
    let spawnQueue: EnemyDef[] = [];
    let spawnTimer = 0;
    let totalSpawned = 0;
    let totalToSpawn = 0;

    gameState.phase = 'countdown';
    gameState.wave = 1;
    gameState.totalWaves = TOTAL_WAVES;
    gameState.matchTime = 0;

    function buildSpawnQueue(wave: WaveConfig): EnemyDef[] {
        const queue: EnemyDef[] = [];
        for (const entry of wave.entries) {
            for (let i = 0; i < entry.count; i++) {
                queue.push(entry.enemy);
            }
        }
        // Shuffle so enemy types are interleaved
        for (let i = queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue[i], queue[j]] = [queue[j], queue[i]];
        }
        return queue;
    }

    function startWave(index: number) {
        currentWaveIndex = index;
        const baseWave = WAVE_CONFIGS[index];
        scaledWave = scaleWaveForPlayers(baseWave, gameState.playerCount);

        props.setDarknessLevel(scaledWave.darknessLevel);
        props.setSunStrength(scaledWave.sunStrength);

        spawnQueue = buildSpawnQueue(scaledWave);
        totalToSpawn = spawnQueue.length;
        totalSpawned = 0;
        spawnTimer = 0.1;

        phase = 'spawning';
        gameState.phase =
            currentWaveIndex === TOTAL_WAVES - 1 ? 'boss' : 'playing';
        gameState.wave = index + 1;
        gameState.enemiesTotal = totalToSpawn;
        gameState.enemiesRemaining = totalToSpawn;
    }

    useFrameUpdate((dt) => {
        gameState.matchTime += dt;

        // Lose condition: player dead
        if (
            phase !== 'defeat' &&
            phase !== 'victory' &&
            !props.isPlayerAlive()
        ) {
            phase = 'defeat';
            gameState.phase = 'defeat';
            return;
        }

        switch (phase) {
            case 'countdown': {
                phaseTimer -= dt;
                gameState.countdownTimer = Math.max(0, phaseTimer);
                if (phaseTimer <= 0) {
                    gameState.countdownTimer = 0;
                    startWave(0);
                }
                break;
            }

            case 'spawning': {
                spawnTimer -= dt;
                if (spawnTimer <= 0 && spawnQueue.length > 0) {
                    const enemyDef = spawnQueue.shift()!;
                    props.spawnEnemy(enemyDef);
                    totalSpawned++;
                    spawnTimer = scaledWave!.spawnInterval;
                }

                gameState.enemiesRemaining =
                    spawnQueue.length + props.getAliveEnemyCount();

                if (spawnQueue.length === 0) {
                    phase = 'active';
                }
                break;
            }

            case 'active': {
                const aliveCount = props.getAliveEnemyCount();
                gameState.enemiesRemaining = aliveCount;

                if (aliveCount === 0 && totalSpawned === totalToSpawn) {
                    if (currentWaveIndex >= TOTAL_WAVES - 1) {
                        phase = 'victory';
                        gameState.phase = 'victory';
                    } else {
                        phase = 'wave_clear';
                        gameState.phase = 'wave_clear';
                        phaseTimer = WAVE_CLEAR_PAUSE;
                    }
                }
                break;
            }

            case 'wave_clear': {
                phaseTimer -= dt;
                gameState.countdownTimer = Math.max(0, phaseTimer);
                if (phaseTimer <= 0) {
                    gameState.countdownTimer = 0;
                    const choices = pickRandomRefractions(
                        3,
                        gameState.refractions.active,
                    );
                    if (choices.length === 0) {
                        startWave(currentWaveIndex + 1);
                    } else {
                        phase = 'refraction_pick';
                        gameState.phase = 'refraction_pick';
                        gameState.refractions.choices = choices;
                    }
                }
                break;
            }

            case 'refraction_pick':
                break;

            case 'victory':
            case 'defeat':
                break;
        }
    });

    return {
        onEnemyKilled() {},
        getWavePhase(): WavePhase {
            return phase;
        },
        getCountdownTimer(): number {
            return phase === 'countdown' ? Math.ceil(phaseTimer) : 0;
        },
        getWaveClearTimer(): number {
            return phase === 'wave_clear' ? phaseTimer : 0;
        },
        advancePastRefractionPick() {
            if (phase !== 'refraction_pick') return;
            startWave(currentWaveIndex + 1);
        },
    };
}
