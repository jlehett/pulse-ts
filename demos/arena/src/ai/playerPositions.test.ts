import {
    PlayerPositionStore,
    setPlayerPosition,
    getPlayerPosition,
} from './playerPositions';

function createStore() {
    return PlayerPositionStore._factory();
}

describe('playerPositions', () => {
    it('returns [0,0,0] by default', () => {
        const store = createStore();
        expect(getPlayerPosition(store, 0)).toEqual([0, 0, 0]);
        expect(getPlayerPosition(store, 1)).toEqual([0, 0, 0]);
    });

    it('stores and retrieves player 0 position', () => {
        const store = createStore();
        setPlayerPosition(store, 0, 1, 2, 3);
        expect(getPlayerPosition(store, 0)).toEqual([1, 2, 3]);
    });

    it('stores and retrieves player 1 position', () => {
        const store = createStore();
        setPlayerPosition(store, 1, 4, 5, 6);
        expect(getPlayerPosition(store, 1)).toEqual([4, 5, 6]);
    });

    it('players are independent', () => {
        const store = createStore();
        setPlayerPosition(store, 0, 1, 1, 1);
        setPlayerPosition(store, 1, 9, 9, 9);
        expect(getPlayerPosition(store, 0)).toEqual([1, 1, 1]);
        expect(getPlayerPosition(store, 1)).toEqual([9, 9, 9]);
    });

    it('each store instance starts fresh (world-scoped isolation)', () => {
        const store1 = createStore();
        setPlayerPosition(store1, 0, 10, 20, 30);

        const store2 = createStore();
        expect(getPlayerPosition(store2, 0)).toEqual([0, 0, 0]);
    });

    it('overwrites previous values', () => {
        const store = createStore();
        setPlayerPosition(store, 0, 1, 2, 3);
        setPlayerPosition(store, 0, 7, 8, 9);
        expect(getPlayerPosition(store, 0)).toEqual([7, 8, 9]);
    });

    it('factory returns a fresh object each call', () => {
        const a = PlayerPositionStore._factory();
        const b = PlayerPositionStore._factory();
        expect(a).not.toBe(b);
    });
});
