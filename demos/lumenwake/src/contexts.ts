import { createContext } from '@pulse-ts/core';
import type { MapConfig } from './config/maps';

export type GamePhase =
    | 'waiting'
    | 'countdown'
    | 'playing'
    | 'wave_clear'
    | 'refraction_pick'
    | 'boss'
    | 'victory'
    | 'defeat';

export interface GameState {
    phase: GamePhase;
    wave: number;
    totalWaves: number;
    matchTime: number;
    /** Enemies still alive + yet to spawn in current wave. */
    enemiesRemaining: number;
    /** Total enemies in current wave (for display as denominator). */
    enemiesTotal: number;
    /** Countdown seconds remaining (pre-match or between waves). */
    countdownTimer: number;
    playerCount: number;
    isHost: boolean;
    map: MapConfig;
}

export const GameCtx = createContext<GameState>('GameState');
