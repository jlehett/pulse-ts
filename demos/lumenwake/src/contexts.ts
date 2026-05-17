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
    playerCount: number;
    isHost: boolean;
    map: MapConfig;
}

export const GameCtx = createContext<GameState>('GameState');
