import { AUGMENT_BY_ID, AUGMENTS } from '../config/augments';
import {
    BASE_NODE_GOLD,
    BENCH_SIZE,
    COMBINE_COUNT,
    ELITE_BONUS_GOLD,
    INTEREST_CAP,
    INTEREST_PER,
    LOSS_DAMAGE_BASE,
    LOSS_DAMAGE_PER_UNIT,
    MAX_LEVEL,
    POOL_SIZE,
    REFRESH_COST,
    SHOP_ODDS,
    SHOP_SIZE,
    STARTING_CORE,
    STARTING_GOLD,
    STARTING_LEVEL,
    STREAK_GOLD_CAP,
    STREAK_GOLD_PER,
    XP_BUY_AMOUNT,
    XP_BUY_COST,
    XP_PER_NODE,
    XP_TO_LEVEL,
    sellValue,
} from '../config/economy';
import { ELITE_STAT_SCALE, FLOOR_WAVES, floorScale } from '../config/enemies';
import {
    COMPONENTS,
    MAX_ITEMS_PER_UNIT,
    combineItems,
    isComponent,
} from '../config/items';
import type { AugmentDef, EventOutcome, UnitDef } from '../config/types';
import { SHOP_UNITS, UNIT_BY_ID } from '../config/units';
import { isPlayerCell } from '../sim/grid';
import type { PlacedUnit } from '../sim/types';
import {
    availableNodes,
    generateMap,
    nodeById,
    type MapGraph,
    type MapNode,
} from './mapGen';
import { createRng, type Rng } from './rng';

/** A construct owned by the player. */
export interface OwnedUnit {
    uid: string;
    defId: string;
    star: number;
    /** Equipped item ids (components or combined; max 3). */
    items?: string[];
}

/** An owned construct deployed on the board. */
export interface BoardUnit extends OwnedUnit {
    row: number;
    col: number;
}

/** Whole-run status. */
export type RunStatus = 'active' | 'victory' | 'defeat';

/** Serializable state of one run. */
export interface RunState {
    seed: string;
    rngState: number;
    status: RunStatus;
    /** Core integrity — the run's hit points (0-100). */
    core: number;
    gold: number;
    level: number;
    xp: number;
    map: MapGraph;
    /** Node the player currently occupies (null before the first embark). */
    currentNodeId: string | null;
    completedNodes: string[];
    board: BoardUnit[];
    bench: OwnedUnit[];
    /** Unit def ids on offer (null = purchased slot). */
    shop: (string | null)[];
    shopLocked: boolean;
    /** Unequipped item ids in the player's stash. */
    items: string[];
    /** Pending salvage picks; each entry is 3 component ids to choose from. */
    pendingSalvage: string[][];
    /** Augment ids acquired this run. */
    augments: string[];
    /** Augment picks owed to the player (each = one pick-1-of-3 screen). */
    pendingAugments: number;
    /** Consecutive battle wins. */
    streak: number;
    /** Remaining shop copies per unit def id. */
    pool: Record<string, number>;
    nextUid: number;
    battlesWon: number;
}

/** Runs `fn` with the state's RNG, persisting the RNG state afterwards. */
function withRng<T>(state: RunState, fn: (rng: Rng) => T): T {
    const rng = createRng(state.rngState);
    const result = fn(rng);
    state.rngState = rng.getState();
    return result;
}

/**
 * Creates a fresh run for a seed.
 *
 * @param seed - Display seed string (e.g. `OVR-7X24Q`).
 * @returns A new {@link RunState} with a generated map and initial shop.
 *
 * @example
 * const run = createRun('OVR-7X24Q');
 * run.map.floors; // 8
 */
export function createRun(seed: string): RunState {
    const rng = createRng(seed);
    const map = generateMap(rng);
    const pool: Record<string, number> = {};
    for (const unit of SHOP_UNITS) pool[unit.id] = POOL_SIZE[unit.cost];

    const state: RunState = {
        seed,
        rngState: rng.getState(),
        status: 'active',
        core: STARTING_CORE,
        gold: STARTING_GOLD,
        level: STARTING_LEVEL,
        xp: 0,
        map,
        currentNodeId: null,
        completedNodes: [],
        board: [],
        bench: [],
        shop: new Array(SHOP_SIZE).fill(null),
        shopLocked: false,
        items: [],
        pendingSalvage: [],
        augments: [],
        pendingAugments: 0,
        streak: 0,
        pool,
        nextUid: 1,
        battlesWon: 0,
    };
    rollShop(state, true);
    return state;
}

/** All active augment definitions on the run. */
export function activeAugments(state: RunState): AugmentDef[] {
    return state.augments
        .map((id) => AUGMENT_BY_ID.get(id))
        .filter((a): a is AugmentDef => !!a);
}

/** Max constructs the player may field (level + augment bonuses). */
export function boardCapacity(state: RunState): number {
    let bonus = 0;
    for (const aug of activeAugments(state)) {
        if (aug.effect.type === 'bonusTeamSize') bonus += aug.effect.amount;
    }
    return state.level + bonus;
}

/** Current shop refresh price after augment discounts. */
export function refreshCost(state: RunState): number {
    let cost = REFRESH_COST;
    for (const aug of activeAugments(state)) {
        if (aug.effect.type === 'refreshDiscount') {
            cost = Math.min(cost, aug.effect.amount);
        }
    }
    return cost;
}

/** Interest earned on banked gold, respecting augment cap raises. */
export function interestFor(state: RunState): number {
    let cap = INTEREST_CAP;
    for (const aug of activeAugments(state)) {
        if (aug.effect.type === 'interestCap') cap += aug.effect.amount;
    }
    return Math.min(cap, Math.floor(state.gold / INTEREST_PER));
}

/** XP needed to reach the next level, or null at cap. */
export function xpToNext(state: RunState): number | null {
    return state.level >= MAX_LEVEL ? null : XP_TO_LEVEL[state.level];
}

/**
 * Grants XP, applying level-ups (overflow carries).
 */
export function addXp(state: RunState, amount: number): void {
    if (state.level >= MAX_LEVEL) return;
    state.xp += amount;
    let need = xpToNext(state);
    while (need !== null && state.xp >= need) {
        state.xp -= need;
        state.level++;
        need = xpToNext(state);
    }
    if (state.level >= MAX_LEVEL) state.xp = 0;
}

/** Buys XP with gold. Returns false when unaffordable or at cap. */
export function buyXp(state: RunState): boolean {
    if (state.gold < XP_BUY_COST || state.level >= MAX_LEVEL) return false;
    state.gold -= XP_BUY_COST;
    addXp(state, XP_BUY_AMOUNT);
    return true;
}

/**
 * Rolls the shop. Costs {@link refreshCost} unless `free`.
 *
 * Units are drawn per-slot: first a cost tier by level odds, then a unit
 * weighted by remaining pool copies.
 *
 * @returns False when unaffordable.
 */
export function rollShop(state: RunState, free = false): boolean {
    if (!free) {
        const cost = refreshCost(state);
        if (state.gold < cost) return false;
        state.gold -= cost;
    }
    // Return unsold shop stock to the pool before re-rolling.
    for (const defId of state.shop) {
        if (defId) state.pool[defId] = (state.pool[defId] ?? 0) + 1;
    }
    withRng(state, (rng) => {
        const odds = SHOP_ODDS[Math.min(MAX_LEVEL, Math.max(3, state.level))];
        for (let slot = 0; slot < SHOP_SIZE; slot++) {
            state.shop[slot] = drawUnit(state, rng, odds);
        }
    });
    state.shopLocked = false;
    return true;
}

function drawUnit(
    state: RunState,
    rng: Rng,
    odds: readonly number[],
): string | null {
    // Pick a cost tier by odds, falling back to lower tiers when the pool
    // for the rolled tier is exhausted.
    const roll = rng.next() * 100;
    let acc = 0;
    let tier = 1;
    for (let i = 0; i < odds.length; i++) {
        acc += odds[i];
        if (roll < acc) {
            tier = i + 1;
            break;
        }
    }
    for (let attempt = 0; attempt < 5; attempt++) {
        const candidates = SHOP_UNITS.filter(
            (u) => u.cost === tier && (state.pool[u.id] ?? 0) > 0,
        );
        if (candidates.length > 0) {
            const total = candidates.reduce(
                (sum, u) => sum + state.pool[u.id],
                0,
            );
            let pickRoll = rng.next() * total;
            for (const unit of candidates) {
                pickRoll -= state.pool[unit.id];
                if (pickRoll <= 0) {
                    state.pool[unit.id]--;
                    return unit.id;
                }
            }
        }
        tier = tier > 1 ? tier - 1 : tier + 1;
        if (tier > 5) break;
    }
    return null;
}

/** Every unit the player owns (board + bench). */
export function allOwned(state: RunState): OwnedUnit[] {
    return [...state.board, ...state.bench];
}

/**
 * Buys the unit in a shop slot onto the bench. Allowed with a full bench
 * only when the purchase completes a combine.
 *
 * @returns False when the slot is empty, unaffordable, or there's no room.
 */
export function buyUnit(state: RunState, slot: number): boolean {
    const defId = state.shop[slot];
    if (!defId) return false;
    const def = UNIT_BY_ID.get(defId);
    if (!def || state.gold < def.cost) return false;

    const benchFull = state.bench.length >= BENCH_SIZE;
    if (benchFull) {
        const copies = allOwned(state).filter(
            (u) => u.defId === defId && u.star === 1,
        ).length;
        if (copies < COMBINE_COUNT - 1) return false;
    }

    state.gold -= def.cost;
    state.shop[slot] = null;
    state.bench.push({ uid: `u${state.nextUid++}`, defId, star: 1 });
    tryCombine(state, defId);
    return true;
}

/**
 * Debug-only: grants a copy of any unit to the bench for free, running the
 * same combine cascade a normal purchase would. Ignores gold. Respects bench
 * capacity, except when the grant completes a combine.
 *
 * @param state - Run state to mutate.
 * @param defId - Unit definition id to grant.
 * @returns False when the id is unknown or the bench is full with no combine.
 * @example
 * ```ts
 * debugGrantUnit(run, 'chock');
 * ```
 */
export function debugGrantUnit(state: RunState, defId: string): boolean {
    if (!UNIT_BY_ID.has(defId)) return false;
    if (state.bench.length >= BENCH_SIZE) {
        const copies = allOwned(state).filter(
            (u) => u.defId === defId && u.star === 1,
        ).length;
        if (copies < COMBINE_COUNT - 1) return false;
    }
    state.bench.push({ uid: `u${state.nextUid++}`, defId, star: 1 });
    tryCombine(state, defId);
    return true;
}

/** Equipped item ids of a unit (never undefined). */
export function equippedItems(unit: OwnedUnit): string[] {
    return unit.items ?? [];
}

/**
 * Fits an item onto a unit, fusing components when possible; overflow goes
 * to the stash. Never fails — used when combining stars merges inventories.
 */
function absorbItem(state: RunState, unit: OwnedUnit, itemId: string): void {
    const items = (unit.items ??= []);
    if (isComponent(itemId)) {
        const partner = items.findIndex((id) => isComponent(id));
        if (partner >= 0) {
            const combined = combineItems(items[partner], itemId);
            if (combined) {
                items[partner] = combined.id;
                return;
            }
        }
    }
    if (items.length < MAX_ITEMS_PER_UNIT) items.push(itemId);
    else state.items.push(itemId);
}

/**
 * Resolves the oldest pending salvage pick by choosing one of its offered
 * components, moving it into the stash.
 *
 * @param state - Run state (mutated).
 * @param itemId - Component id; must be one of the current pick's options.
 * @returns False when no pick is pending or the id is not offered.
 *
 * @example
 * state.pendingSalvage = [['cell', 'core', 'flux']];
 * chooseSalvage(state, 'core'); // true → 'core' added to state.items
 */
export function chooseSalvage(state: RunState, itemId: string): boolean {
    const options = state.pendingSalvage[0];
    if (!options || !options.includes(itemId)) return false;
    state.pendingSalvage.shift();
    state.items.push(itemId);
    return true;
}

/**
 * Equips a stash item onto an owned unit. Equipping a component onto a unit
 * already holding an unpaired component auto-fuses them into the combined
 * item (freeing the slot); otherwise the item takes a free slot.
 *
 * @param state - Run state (mutated).
 * @param uid - Owned unit to equip.
 * @param itemId - Item id currently in {@link RunState.items}.
 * @returns False when the unit or stash item is missing, or all 3 slots are
 * occupied and no fuse applies.
 *
 * @example
 * state.items = ['cell', 'core'];
 * equipItem(state, unit.uid, 'cell'); // true
 * equipItem(state, unit.uid, 'core'); // true → unit holds Hybrid Actuator
 */
export function equipItem(
    state: RunState,
    uid: string,
    itemId: string,
): boolean {
    const unit = allOwned(state).find((u) => u.uid === uid);
    if (!unit) return false;
    const stashIndex = state.items.indexOf(itemId);
    if (stashIndex < 0) return false;

    const items = (unit.items ??= []);
    if (isComponent(itemId)) {
        const partner = items.findIndex((id) => isComponent(id));
        if (partner >= 0) {
            const combined = combineItems(items[partner], itemId);
            if (combined) {
                items[partner] = combined.id;
                state.items.splice(stashIndex, 1);
                return true;
            }
        }
    }
    if (items.length >= MAX_ITEMS_PER_UNIT) return false;
    items.push(itemId);
    state.items.splice(stashIndex, 1);
    return true;
}

/**
 * Combines three same-star copies into one higher-star unit, cascading.
 * Prefers upgrading a board copy so placements survive. Items from the
 * consumed copies transfer to the upgraded unit (overflow to the stash).
 */
export function tryCombine(state: RunState, defId: string): void {
    for (let star = 1; star < 3; star++) {
        for (;;) {
            const boardCopies = state.board.filter(
                (u) => u.defId === defId && u.star === star,
            );
            const benchCopies = state.bench.filter(
                (u) => u.defId === defId && u.star === star,
            );
            if (boardCopies.length + benchCopies.length < COMBINE_COUNT) break;

            const keeper = boardCopies[0] ?? benchCopies[0];
            const removed: OwnedUnit[] = [];
            for (const unit of [...boardCopies, ...benchCopies]) {
                if (unit === keeper || removed.length >= COMBINE_COUNT - 1) {
                    continue;
                }
                removed.push(unit);
            }
            state.board = state.board.filter((u) => !removed.includes(u));
            state.bench = state.bench.filter((u) => !removed.includes(u));
            keeper.star = star + 1;
            for (const unit of removed) {
                for (const itemId of equippedItems(unit)) {
                    absorbItem(state, keeper, itemId);
                }
            }
        }
    }
}

/**
 * Sells an owned unit, refunding gold and returning copies to the pool.
 *
 * @returns False when the uid is unknown.
 */
export function sellUnit(state: RunState, uid: string): boolean {
    const unit = allOwned(state).find((u) => u.uid === uid);
    if (!unit) return false;
    const def = UNIT_BY_ID.get(unit.defId);
    if (!def) return false;
    state.gold += sellValue(def.cost, unit.star);
    state.pool[unit.defId] =
        (state.pool[unit.defId] ?? 0) + Math.pow(COMBINE_COUNT, unit.star - 1);
    state.items.push(...equippedItems(unit));
    state.board = state.board.filter((u) => u.uid !== uid);
    state.bench = state.bench.filter((u) => u.uid !== uid);
    return true;
}

/**
 * Places (or moves) an owned unit onto a player-half board cell. Swaps
 * with any occupant; benching happens via {@link moveToBench}.
 *
 * @returns False for invalid cells or when capacity would be exceeded.
 */
export function placeUnit(
    state: RunState,
    uid: string,
    row: number,
    col: number,
): boolean {
    if (!isPlayerCell(row, col)) return false;
    const onBoard = state.board.find((u) => u.uid === uid);
    const onBench = state.bench.find((u) => u.uid === uid);
    if (!onBoard && !onBench) return false;

    const occupant = state.board.find(
        (u) => u.row === row && u.col === col && u.uid !== uid,
    );

    if (onBoard) {
        if (occupant) {
            occupant.row = onBoard.row;
            occupant.col = onBoard.col;
        }
        onBoard.row = row;
        onBoard.col = col;
        return true;
    }

    // From bench: capacity check (swapping with an occupant keeps count).
    if (!occupant && state.board.length >= boardCapacity(state)) return false;
    state.bench = state.bench.filter((u) => u.uid !== uid);
    if (occupant) {
        state.board = state.board.filter((u) => u.uid !== occupant.uid);
        state.bench.push({
            uid: occupant.uid,
            defId: occupant.defId,
            star: occupant.star,
            items: occupant.items,
        });
    }
    state.board.push({ ...onBench!, row, col });
    return true;
}

/**
 * Returns a board unit to the bench.
 *
 * @returns False when the unit isn't on the board or the bench is full.
 */
export function moveToBench(state: RunState, uid: string): boolean {
    const unit = state.board.find((u) => u.uid === uid);
    if (!unit) return false;
    if (state.bench.length >= BENCH_SIZE) return false;
    state.board = state.board.filter((u) => u.uid !== uid);
    state.bench.push({
        uid: unit.uid,
        defId: unit.defId,
        star: unit.star,
        items: unit.items,
    });
    return true;
}

/** Nodes the player may embark to right now. */
export function embarkOptions(state: RunState): MapNode[] {
    return availableNodes(state.map, state.currentNodeId).map((id) =>
        nodeById(state.map, id),
    );
}

/**
 * Moves the player onto a map node. Battle-type nodes then run a combat;
 * event nodes resolve through {@link applyEventOutcome}.
 *
 * @returns The node embarked to, or null when it isn't reachable.
 */
export function embark(state: RunState, nodeId: string): MapNode | null {
    const options = availableNodes(state.map, state.currentNodeId);
    if (!options.includes(nodeId)) return null;
    state.currentNodeId = nodeId;
    return nodeById(state.map, nodeId);
}

/** The current node, or null before the first embark. */
export function currentNode(state: RunState): MapNode | null {
    return state.currentNodeId
        ? nodeById(state.map, state.currentNodeId)
        : null;
}

/** Enemy wave definition + scaling for a battle-type node. */
export function waveForNode(node: MapNode): {
    name: string;
    placements: PlacedUnit[];
    statScale: number;
} {
    const wave = FLOOR_WAVES[node.floor][node.waveIndex];
    const elite = node.type === 'elite';
    const scale =
        floorScale(node.floor) *
        (wave.statScale ?? 1) *
        (elite ? ELITE_STAT_SCALE : 1);
    return {
        name: elite ? `Elite · ${wave.name}` : wave.name,
        placements: wave.placements.map((p, i) => ({
            uid: `enemy-${i}`,
            defId: p.unitId,
            star: p.star,
            row: p.row,
            col: p.col,
        })),
        statScale: scale,
    };
}

/** Player board converted to sim placements. */
export function playerPlacements(state: RunState): PlacedUnit[] {
    return state.board.map((u) => ({
        uid: u.uid,
        defId: u.defId,
        star: u.star,
        row: u.row,
        col: u.col,
        items: u.items,
    }));
}

/** Outcome summary of a resolved battle, for UI display. */
export interface BattleResolution {
    won: boolean;
    goldEarned: number;
    coreDamage: number;
    augmentOffered: boolean;
    /**
     * Salvage picks earned by the victory (also queued on
     * {@link RunState.pendingSalvage}); each entry is 3 component ids the
     * player chooses one from via {@link chooseSalvage}.
     */
    salvageChoices: string[][];
    runStatus: RunStatus;
}

/** Components a win at a node drops (elites drop double). */
function itemDropCount(nodeType: MapNode['type']): number {
    return nodeType === 'elite' ? 2 : 1;
}

/**
 * Applies a battle result to the run.
 *
 * Wins pay out base gold + streak + interest, grant XP, and complete the
 * node — elite wins and the floor-4 milestone also owe an augment pick;
 * beating the boss wins the run. Losses cost core integrity and reset the
 * streak; the node stays incomplete so the player retries it (defeat at 0
 * core).
 *
 * @param state - Run state (mutated).
 * @param won - Whether the player won the combat.
 * @param enemySurvivors - Enemy units alive at the end (loss damage).
 */
export function resolveBattle(
    state: RunState,
    won: boolean,
    enemySurvivors: number,
): BattleResolution {
    const node = currentNode(state);
    if (!node) throw new Error('resolveBattle without a current node');

    if (!won) {
        const damage = LOSS_DAMAGE_BASE + LOSS_DAMAGE_PER_UNIT * enemySurvivors;
        state.core -= damage;
        state.streak = 0;
        if (state.core <= 0) {
            state.core = 0;
            state.status = 'defeat';
        }
        return {
            won,
            goldEarned: 0,
            coreDamage: damage,
            augmentOffered: false,
            salvageChoices: [],
            runStatus: state.status,
        };
    }

    const streakBonus = Math.min(
        STREAK_GOLD_CAP,
        state.streak * STREAK_GOLD_PER,
    );
    const goldEarned =
        BASE_NODE_GOLD +
        (node.type === 'elite' ? ELITE_BONUS_GOLD : 0) +
        streakBonus +
        interestFor(state);
    state.gold += goldEarned;
    state.streak++;
    state.battlesWon++;
    addXp(state, XP_PER_NODE);
    state.completedNodes.push(node.id);

    const salvageChoices = withRng(state, (rng) =>
        Array.from({ length: itemDropCount(node.type) }, () => {
            const pool = COMPONENTS.map((c) => c.id);
            return Array.from(
                { length: 3 },
                () => pool.splice(rng.int(pool.length), 1)[0],
            );
        }),
    );
    state.pendingSalvage.push(...salvageChoices);

    let augmentOffered = false;
    if (node.type === 'elite' || state.battlesWon === 3) {
        state.pendingAugments++;
        augmentOffered = true;
    }
    if (node.type === 'boss') state.status = 'victory';

    if (!state.shopLocked) rollShop(state, true);

    return {
        won,
        goldEarned,
        coreDamage: 0,
        augmentOffered,
        salvageChoices,
        runStatus: state.status,
    };
}

/**
 * Previews the reward a win at the current node would pay, without mutating
 * the run. Mirrors the win branch of {@link resolveBattle}: base gold plus
 * elite bonus, streak bonus, and interest, whether an augment pick would
 * be offered (elite node, or this win being the third), and how many item
 * components would drop.
 *
 * @param state - Run state (not mutated).
 * @returns Previewed gold payout, augment-offer flag, and item drop count.
 */
export function previewReward(state: RunState): {
    gold: number;
    augment: boolean;
    items: number;
} {
    const node = currentNode(state);
    const streakBonus = Math.min(
        STREAK_GOLD_CAP,
        state.streak * STREAK_GOLD_PER,
    );
    return {
        gold:
            BASE_NODE_GOLD +
            (node?.type === 'elite' ? ELITE_BONUS_GOLD : 0) +
            streakBonus +
            interestFor(state),
        augment: node?.type === 'elite' || state.battlesWon === 2,
        items: node ? itemDropCount(node.type) : 0,
    };
}

/**
 * Marks a non-combat (event) node complete.
 */
export function completeEventNode(state: RunState): void {
    const node = currentNode(state);
    if (node && !state.completedNodes.includes(node.id)) {
        state.completedNodes.push(node.id);
    }
    if (!state.shopLocked) rollShop(state, true);
}

/**
 * Rolls three distinct augment choices the player doesn't own yet.
 * Prismatic augments only show up from floor 3 onwards.
 */
export function augmentChoices(state: RunState): AugmentDef[] {
    const floor = currentNode(state)?.floor ?? 0;
    const eligible = AUGMENTS.filter(
        (a) =>
            !state.augments.includes(a.id) &&
            (a.tier !== 'prismatic' || floor >= 3),
    );
    return withRng(state, (rng) => {
        const picks: AugmentDef[] = [];
        const remaining = [...eligible];
        while (picks.length < 3 && remaining.length > 0) {
            const i = rng.int(remaining.length);
            picks.push(remaining.splice(i, 1)[0]);
        }
        return picks;
    });
}

/**
 * Applies a chosen augment, consuming one pending pick and resolving
 * immediate effects (gold, repair, XP).
 */
export function applyAugment(state: RunState, augmentId: string): void {
    const aug = AUGMENT_BY_ID.get(augmentId);
    if (!aug) throw new Error(`Unknown augment: ${augmentId}`);
    state.augments.push(aug.id);
    state.pendingAugments = Math.max(0, state.pendingAugments - 1);
    const e = aug.effect;
    if (e.type === 'goldNow') state.gold += e.amount;
    if (e.type === 'coreRepair') {
        state.core = Math.min(STARTING_CORE, state.core + e.amount);
    }
}

/** Text summary of what an event outcome did, for the UI. */
export interface EventResult {
    summary: string;
}

/**
 * Resolves an event choice outcome against the run state.
 */
export function applyEventOutcome(
    state: RunState,
    outcome: EventOutcome,
): EventResult {
    switch (outcome.type) {
        case 'gold':
            state.gold += outcome.amount;
            return { summary: `+${outcome.amount} gold` };
        case 'coreDamage': {
            state.core -= outcome.amount;
            if (state.core <= 0) {
                state.core = 0;
                state.status = 'defeat';
            }
            return { summary: `-${outcome.amount} core integrity` };
        }
        case 'coreRepair': {
            const before = state.core;
            state.core = Math.min(STARTING_CORE, state.core + outcome.amount);
            return { summary: `+${state.core - before} core integrity` };
        }
        case 'xp':
            addXp(state, outcome.amount);
            return { summary: `+${outcome.amount} XP` };
        case 'augment':
            state.pendingAugments++;
            return { summary: 'Augment acquired' };
        case 'freeUnit': {
            const unit = withRng(state, (rng) => {
                const candidates = SHOP_UNITS.filter(
                    (u) =>
                        u.cost === outcome.costTier &&
                        (state.pool[u.id] ?? 0) > 0,
                );
                return candidates.length > 0 ? rng.pick(candidates) : null;
            });
            if (!unit || state.bench.length >= BENCH_SIZE) {
                const refund = outcome.costTier * 2;
                state.gold += refund;
                return { summary: `No room — salvaged for ${refund} gold` };
            }
            state.pool[unit.id]--;
            state.bench.push({
                uid: `u${state.nextUid++}`,
                defId: unit.id,
                star: 1,
            });
            tryCombine(state, unit.id);
            return { summary: `${unit.name} joined your bench` };
        }
        case 'gamble': {
            const won = withRng(state, (rng) => rng.next() < outcome.winChance);
            return applyEventOutcome(state, won ? outcome.win : outcome.lose);
        }
        case 'nothing':
            return { summary: 'Nothing happened' };
    }
}

/** Unit definition lookup that throws on unknown ids. */
export function defOf(unit: OwnedUnit): UnitDef {
    const def = UNIT_BY_ID.get(unit.defId);
    if (!def) throw new Error(`Unknown unit def: ${unit.defId}`);
    return def;
}
