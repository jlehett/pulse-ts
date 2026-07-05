/**
 * Economy tuning tables: gold income, XP curve, shop odds, sizing.
 * Pure data — consumed by the run layer.
 */

/** Gold granted for clearing a battle node (before interest/streak). */
export const BASE_NODE_GOLD = 5;
/** Extra gold for clearing an elite node. */
export const ELITE_BONUS_GOLD = 3;
/** Gold per win-streak step (capped). */
export const STREAK_GOLD_PER = 1;
export const STREAK_GOLD_CAP = 3;
/** Interest: 1 gold per this many banked, up to the cap. */
export const INTEREST_PER = 10;
export const INTEREST_CAP = 5;

/** Shop actions. */
export const REFRESH_COST = 2;
export const XP_BUY_COST = 4;
export const XP_BUY_AMOUNT = 4;
/** XP gained automatically when a node is cleared. */
export const XP_PER_NODE = 2;

/** Sell value: full cost at 1 star; combined copies refund per-copy cost. */
export function sellValue(cost: number, star: number): number {
    if (star === 1) return cost;
    return cost * Math.pow(3, star - 1) - 1;
}

/** Number of cards in a shop roll. */
export const SHOP_SIZE = 5;

/** Player level range. Board capacity equals level. */
export const MIN_LEVEL = 3;
export const MAX_LEVEL = 9;
/** Bench capacity. */
export const BENCH_SIZE = 9;

/** Total XP required to reach the next level, indexed by current level. */
export const XP_TO_LEVEL: Record<number, number> = {
    3: 6,
    4: 10,
    5: 20,
    6: 32,
    7: 50,
    8: 66,
};

/**
 * Shop roll odds per player level: probability weights of hitting each cost
 * tier (1-5), summing to 100.
 */
export const SHOP_ODDS: Record<
    number,
    [number, number, number, number, number]
> = {
    3: [75, 25, 0, 0, 0],
    4: [55, 30, 15, 0, 0],
    5: [45, 33, 20, 2, 0],
    6: [30, 40, 25, 5, 0],
    7: [20, 33, 35, 10, 2],
    8: [15, 25, 35, 20, 5],
    9: [10, 15, 30, 30, 15],
};

/**
 * Pool sizes: how many copies of each unit exist per cost tier, shared
 * between player purchases (enemies don't consume the pool).
 */
export const POOL_SIZE: Record<number, number> = {
    1: 20,
    2: 15,
    3: 12,
    4: 9,
    5: 7,
};

/** Copies of a unit required to combine into the next star level. */
export const COMBINE_COUNT = 3;

/** Starting resources for a fresh run. */
export const STARTING_GOLD = 8;
export const STARTING_LEVEL = 3;
export const STARTING_CORE = 100;

/**
 * Core-integrity damage taken when a battle is lost: base + per surviving
 * enemy unit.
 */
export const LOSS_DAMAGE_BASE = 6;
export const LOSS_DAMAGE_PER_UNIT = 2;

/** Combat round time limit in seconds; timing out counts as a loss. */
export const COMBAT_TIME_LIMIT = 45;
