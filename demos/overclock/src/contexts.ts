import { createContext } from '@pulse-ts/core';
import type { MapNode } from './run/mapGen';
import type { RunState } from './run/runState';
import type { CombatState, PlacedUnit } from './sim/types';

/** Phases of one battle-node visit. */
export type BattlePhase = 'prep' | 'combat' | 'victory' | 'defeat';

/** Mutable shared state for a battle scene. */
export interface BattleState {
    run: RunState;
    node: MapNode;
    /** Enemy force preview (prep) and combat source. */
    wave: { name: string; placements: PlacedUnit[]; statScale: number };
    phase: BattlePhase;
    /** Live sim while phase === 'combat' (and for end-state display). */
    combat: CombatState | null;
    /** Seconds remaining on the combat clock. */
    timeLeft: number;
    /** Currently dragged owned unit (prep only). */
    dragUid: string | null;
    /** Ground-plane position under the pointer during a drag. */
    dragWorld: [number, number] | null;
    /** Player cell the pointer hovers during a drag. */
    hoverCell: { row: number; col: number } | null;
    /** True while the pointer is over the bench rail during a drag. */
    hoverBench: boolean;
    /** Owned unit under the cursor (for sell/tooltips). */
    hoverUid: string | null;
    /** Result payout captured when combat ends (for the result overlay). */
    resolution: {
        goldEarned: number;
        coreDamage: number;
        augmentOffered: boolean;
    } | null;
    /** Bumps whenever run board/bench/shop mutate, for cheap dirty checks. */
    revision: number;
}

/** Context handle for the battle scene's shared state. */
export const BattleCtx = createContext<BattleState>('BattleState');
