import { createContext } from '@pulse-ts/core';

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
}

export const GameCtx = createContext<GameState>('GameState');
