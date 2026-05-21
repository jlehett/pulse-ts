import { createContext } from '@pulse-ts/core';
import type { MapConfig } from './config/maps';
import type { RefractionDef } from './config/refractions';

export type GamePhase =
    | 'waiting'
    | 'countdown'
    | 'playing'
    | 'wave_clear'
    | 'refraction_pick'
    | 'boss'
    | 'victory'
    | 'defeat';

export interface RefractionState {
    /** Active refractions: id → current tier (1, 2, or 3). */
    active: Map<string, number>;
    /** The 3 choices presented during refraction_pick phase. */
    choices: RefractionDef[];
}

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
    refractions: RefractionState;
}

export const GameCtx = createContext<GameState>('GameState');
