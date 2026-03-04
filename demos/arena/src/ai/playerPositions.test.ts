import {
    setPlayerPosition,
    getPlayerPosition,
    resetPlayerPositions,
} from './playerPositions';

afterEach(() => {
    resetPlayerPositions();
});

describe('playerPositions', () => {
    it('returns [0,0,0] by default', () => {
        expect(getPlayerPosition(0)).toEqual([0, 0, 0]);
        expect(getPlayerPosition(1)).toEqual([0, 0, 0]);
    });

    it('stores and retrieves player 0 position', () => {
        setPlayerPosition(0, 1, 2, 3);
        expect(getPlayerPosition(0)).toEqual([1, 2, 3]);
    });

    it('stores and retrieves player 1 position', () => {
        setPlayerPosition(1, 4, 5, 6);
        expect(getPlayerPosition(1)).toEqual([4, 5, 6]);
    });

    it('players are independent', () => {
        setPlayerPosition(0, 1, 1, 1);
        setPlayerPosition(1, 9, 9, 9);
        expect(getPlayerPosition(0)).toEqual([1, 1, 1]);
        expect(getPlayerPosition(1)).toEqual([9, 9, 9]);
    });

    it('resetPlayerPositions clears both players', () => {
        setPlayerPosition(0, 10, 20, 30);
        setPlayerPosition(1, 40, 50, 60);
        resetPlayerPositions();
        expect(getPlayerPosition(0)).toEqual([0, 0, 0]);
        expect(getPlayerPosition(1)).toEqual([0, 0, 0]);
    });

    it('overwrites previous values', () => {
        setPlayerPosition(0, 1, 2, 3);
        setPlayerPosition(0, 7, 8, 9);
        expect(getPlayerPosition(0)).toEqual([7, 8, 9]);
    });
});
