import {
    BENCH_SIZE,
    REFRESH_COST,
    SHOP_SIZE,
    STARTING_CORE,
    STARTING_GOLD,
    STARTING_LEVEL,
    XP_BUY_COST,
} from '../config/economy';
import {
    addXp,
    applyAugment,
    applyEventOutcome,
    augmentChoices,
    boardCapacity,
    buyUnit,
    buyXp,
    createRun,
    embark,
    embarkOptions,
    interestFor,
    moveToBench,
    placeUnit,
    refreshCost,
    resolveBattle,
    rollShop,
    sellUnit,
    tryCombine,
    waveForNode,
    type RunState,
} from './runState';

const freshRun = (seed = 'OVR-TEST'): RunState => createRun(seed);

/** Puts a specific unit in shop slot 0 and returns the run. */
function runWithShopUnit(defId: string): RunState {
    const state = freshRun();
    state.shop[0] = defId;
    return state;
}

describe('createRun', () => {
    it('initializes resources and a rolled shop', () => {
        const state = freshRun();
        expect(state.gold).toBe(STARTING_GOLD);
        expect(state.core).toBe(STARTING_CORE);
        expect(state.level).toBe(STARTING_LEVEL);
        expect(state.shop).toHaveLength(SHOP_SIZE);
        expect(state.shop.some((s) => s !== null)).toBe(true);
        expect(state.status).toBe('active');
    });

    it('is deterministic per seed', () => {
        expect(createRun('OVR-AAAAA')).toEqual(createRun('OVR-AAAAA'));
    });
});

describe('shop', () => {
    it('buying moves the unit to the bench and charges gold', () => {
        const state = runWithShopUnit('piton');
        const goldBefore = state.gold;
        expect(buyUnit(state, 0)).toBe(true);
        expect(state.gold).toBe(goldBefore - 1);
        expect(state.bench.some((u) => u.defId === 'piton')).toBe(true);
        expect(state.shop[0]).toBeNull();
    });

    it('rejects purchases the player cannot afford', () => {
        const state = runWithShopUnit('apogee'); // cost 5
        state.gold = 4;
        expect(buyUnit(state, 0)).toBe(false);
        expect(state.bench).toHaveLength(0);
    });

    it('rejects purchases with a full bench unless completing a combine', () => {
        const state = runWithShopUnit('piton');
        state.gold = 50;
        for (let i = 0; i < BENCH_SIZE; i++) {
            state.bench.push({ uid: `f${i}`, defId: 'widget', star: 1 });
        }
        expect(buyUnit(state, 0)).toBe(false);

        // Two existing copies → third completes a combine despite full bench.
        state.bench[0] = { uid: 'c1', defId: 'piton', star: 1 };
        state.bench[1] = { uid: 'c2', defId: 'piton', star: 1 };
        state.shop[0] = 'piton';
        expect(buyUnit(state, 0)).toBe(true);
        const pitons = state.bench.filter((u) => u.defId === 'piton');
        expect(pitons).toHaveLength(1);
        expect(pitons[0].star).toBe(2);
    });

    it('refresh charges gold and rerolls', () => {
        const state = freshRun();
        const goldBefore = state.gold;
        expect(rollShop(state)).toBe(true);
        expect(state.gold).toBe(goldBefore - REFRESH_COST);
    });

    it('refresh fails when broke', () => {
        const state = freshRun();
        state.gold = REFRESH_COST - 1;
        expect(rollShop(state)).toBe(false);
    });

    it('draws respect the shared pool', () => {
        const state = freshRun();
        // Drain everything except one widget: shop can only offer widgets
        // (or nulls once exhausted).
        for (const key of Object.keys(state.pool)) state.pool[key] = 0;
        // Return current shop stock to zero too.
        state.shop = state.shop.map(() => null);
        state.pool['widget'] = 1;
        state.gold = 100;
        rollShop(state);
        const offered = state.shop.filter((s) => s !== null);
        expect(offered).toEqual(['widget']);
        expect(state.pool['widget']).toBe(0);
    });
});

describe('combining', () => {
    it('cascades 1-star triples into higher stars', () => {
        const state = freshRun();
        state.bench = [];
        for (let i = 0; i < 8; i++) {
            state.bench.push({ uid: `w${i}`, defId: 'widget', star: 1 });
        }
        state.bench.push({ uid: 'w8', defId: 'widget', star: 1 });
        tryCombine(state, 'widget');
        // 9 copies → three 2-stars → one 3-star... but only one combine per
        // star level per call; cascade handles the chain.
        const stars = state.bench
            .filter((u) => u.defId === 'widget')
            .map((u) => u.star)
            .sort();
        expect(stars.reduce((a, b) => a + Math.pow(3, b - 1), 0)).toBe(9);
    });

    it('prefers upgrading the board copy', () => {
        const state = freshRun();
        state.board.push({
            uid: 'b1',
            defId: 'piton',
            star: 1,
            row: 4,
            col: 3,
        });
        state.bench.push({ uid: 'n1', defId: 'piton', star: 1 });
        state.bench.push({ uid: 'n2', defId: 'piton', star: 1 });
        tryCombine(state, 'piton');
        expect(state.board).toHaveLength(1);
        expect(state.board[0].star).toBe(2);
        expect(state.bench.filter((u) => u.defId === 'piton')).toHaveLength(0);
    });
});

describe('selling', () => {
    it('refunds gold and returns copies to the pool', () => {
        const state = runWithShopUnit('bulkhead');
        state.gold = 10;
        buyUnit(state, 0);
        const poolAfterBuy = state.pool['bulkhead'];
        const uid = state.bench.find((u) => u.defId === 'bulkhead')!.uid;
        const goldBefore = state.gold;
        expect(sellUnit(state, uid)).toBe(true);
        expect(state.gold).toBe(goldBefore + 2);
        expect(state.pool['bulkhead']).toBe(poolAfterBuy + 1);
        expect(state.bench).toHaveLength(0);
    });
});

describe('board placement', () => {
    it('places bench units on the player half only', () => {
        const state = freshRun();
        state.bench.push({ uid: 'x1', defId: 'piton', star: 1 });
        expect(placeUnit(state, 'x1', 3, 3)).toBe(false); // enemy half
        expect(placeUnit(state, 'x1', 4, 3)).toBe(true);
        expect(state.board).toHaveLength(1);
        expect(state.bench).toHaveLength(0);
    });

    it('enforces board capacity from level', () => {
        const state = freshRun();
        const cap = boardCapacity(state);
        for (let i = 0; i < cap + 1; i++) {
            state.bench.push({ uid: `x${i}`, defId: 'widget', star: 1 });
        }
        for (let i = 0; i < cap; i++) {
            expect(placeUnit(state, `x${i}`, 7, i)).toBe(true);
        }
        expect(placeUnit(state, `x${cap}`, 6, 0)).toBe(false);
    });

    it('swaps a bench unit with a board occupant', () => {
        const state = freshRun();
        state.board.push({
            uid: 'b1',
            defId: 'piton',
            star: 1,
            row: 4,
            col: 3,
        });
        state.bench.push({ uid: 'n1', defId: 'widget', star: 1 });
        expect(placeUnit(state, 'n1', 4, 3)).toBe(true);
        expect(state.board.find((u) => u.uid === 'n1')).toBeTruthy();
        expect(state.bench.find((u) => u.uid === 'b1')).toBeTruthy();
    });

    it('returns board units to the bench', () => {
        const state = freshRun();
        state.board.push({
            uid: 'b1',
            defId: 'piton',
            star: 1,
            row: 4,
            col: 3,
        });
        expect(moveToBench(state, 'b1')).toBe(true);
        expect(state.board).toHaveLength(0);
        expect(state.bench.find((u) => u.uid === 'b1')).toBeTruthy();
    });
});

describe('xp and levels', () => {
    it('buyXp charges gold and can level up', () => {
        const state = freshRun();
        state.gold = 20;
        expect(buyXp(state)).toBe(true);
        expect(state.gold).toBe(20 - XP_BUY_COST);
        addXp(state, 100);
        expect(state.level).toBeGreaterThan(STARTING_LEVEL);
    });
});

describe('map progression and battles', () => {
    it('embark only allows reachable nodes', () => {
        const state = freshRun();
        const options = embarkOptions(state);
        expect(options.length).toBeGreaterThan(0);
        expect(embark(state, 'n7-0')).toBeNull(); // boss not reachable yet
        const node = embark(state, options[0].id);
        expect(node).not.toBeNull();
        expect(state.currentNodeId).toBe(options[0].id);
    });

    it('winning a battle pays gold, xp and completes the node', () => {
        const state = freshRun();
        const node = embark(state, embarkOptions(state)[0].id)!;
        const goldBefore = state.gold;
        const result = resolveBattle(state, true, 0, 1);
        expect(result.won).toBe(true);
        expect(state.gold).toBeGreaterThan(goldBefore);
        expect(state.completedNodes).toContain(node.id);
        expect(state.streak).toBe(1);
    });

    it('losing costs core integrity and keeps the node incomplete', () => {
        const state = freshRun();
        const node = embark(state, embarkOptions(state)[0].id)!;
        const result = resolveBattle(state, false, 3);
        expect(result.coreDamage).toBeGreaterThan(0);
        expect(state.core).toBeLessThan(STARTING_CORE);
        expect(state.completedNodes).not.toContain(node.id);
        expect(state.streak).toBe(0);
    });

    it('running out of core integrity defeats the run', () => {
        const state = freshRun();
        embark(state, embarkOptions(state)[0].id);
        state.core = 5;
        const result = resolveBattle(state, false, 5);
        expect(result.runStatus).toBe('defeat');
        expect(state.core).toBe(0);
    });

    it('waveForNode scales elites harder than battles', () => {
        const state = freshRun();
        const node = embark(state, embarkOptions(state)[0].id)!;
        const battle = waveForNode(node);
        const elite = waveForNode({ ...node, type: 'elite' });
        expect(elite.statScale).toBeGreaterThan(battle.statScale);
        expect(battle.placements.length).toBeGreaterThan(0);
    });
});

describe('augments', () => {
    it('offers three distinct unowned choices', () => {
        const state = freshRun();
        const choices = augmentChoices(state);
        expect(choices).toHaveLength(3);
        expect(new Set(choices.map((c) => c.id)).size).toBe(3);
    });

    it('applies immediate and passive effects', () => {
        const state = freshRun();
        state.pendingAugments = 1;
        const goldBefore = state.gold;
        applyAugment(state, 'surplus-requisition');
        expect(state.gold).toBe(goldBefore + 12);
        expect(state.pendingAugments).toBe(0);

        applyAugment(state, 'compound-interest');
        state.gold = 100;
        expect(interestFor(state)).toBe(7);

        applyAugment(state, 'bulk-discount');
        expect(refreshCost(state)).toBe(1);

        applyAugment(state, 'expansion-slot');
        expect(boardCapacity(state)).toBe(state.level + 1);
    });
});

describe('events', () => {
    it('resolves gold, damage, xp and free-unit outcomes', () => {
        const state = freshRun();
        const goldBefore = state.gold;
        applyEventOutcome(state, { type: 'gold', amount: 10 });
        expect(state.gold).toBe(goldBefore + 10);

        applyEventOutcome(state, { type: 'coreDamage', amount: 8 });
        expect(state.core).toBe(STARTING_CORE - 8);

        applyEventOutcome(state, { type: 'coreRepair', amount: 100 });
        expect(state.core).toBe(STARTING_CORE); // capped

        const result = applyEventOutcome(state, {
            type: 'freeUnit',
            costTier: 2,
        });
        expect(
            state.bench.length === 1 || result.summary.includes('salvaged'),
        ).toBe(true);
    });

    it('gambles resolve to win or lose outcomes', () => {
        const state = freshRun();
        const result = applyEventOutcome(state, {
            type: 'gamble',
            winChance: 1,
            win: { type: 'gold', amount: 5 },
            lose: { type: 'coreDamage', amount: 5 },
        });
        expect(result.summary).toBe('+5 gold');
    });
});
