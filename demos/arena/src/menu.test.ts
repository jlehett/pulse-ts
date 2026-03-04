import { showMainMenu, type MenuChoice } from './menu';

describe('showMainMenu', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    it('renders the menu overlay into the container', () => {
        showMainMenu(container);

        const overlay = container.firstElementChild as HTMLElement;
        expect(overlay).toBeTruthy();
        expect(overlay.style.zIndex).toBe('5000');
    });

    it('displays the game title', () => {
        showMainMenu(container);

        expect(container.textContent).toContain('BUMPER BALLS');
        expect(container.textContent).toContain('ARENA');
    });

    it('displays Solo Play, Local Play, and Online Play buttons', () => {
        showMainMenu(container);

        const buttons = container.querySelectorAll('button');
        expect(buttons).toHaveLength(3);
        expect(buttons[0].textContent).toBe('Solo Play');
        expect(buttons[1].textContent).toBe('Local Play');
        expect(buttons[2].textContent).toBe('Online Play');
    });

    it('resolves with "solo" when Solo Play is clicked', async () => {
        const choicePromise = showMainMenu(container);

        const soloBtn = container.querySelectorAll('button')[0];
        soloBtn.click();

        const overlay = container.firstElementChild as HTMLElement;
        overlay.dispatchEvent(new Event('transitionend'));

        const choice: MenuChoice = await choicePromise;
        expect(choice).toBe('solo');
    });

    it('resolves with "local" when Local Play is clicked', async () => {
        const choicePromise = showMainMenu(container);

        const localBtn = container.querySelectorAll('button')[1];
        localBtn.click();

        // Fire the transitionend event to complete the fade-out
        const overlay = container.firstElementChild as HTMLElement;
        overlay.dispatchEvent(new Event('transitionend'));

        const choice: MenuChoice = await choicePromise;
        expect(choice).toBe('local');
    });

    it('resolves with "online" when Online Play is clicked', async () => {
        const choicePromise = showMainMenu(container);

        const onlineBtn = container.querySelectorAll('button')[2];
        onlineBtn.click();

        const overlay = container.firstElementChild as HTMLElement;
        overlay.dispatchEvent(new Event('transitionend'));

        const choice: MenuChoice = await choicePromise;
        expect(choice).toBe('online');
    });

    it('removes the overlay after selection completes', async () => {
        const choicePromise = showMainMenu(container);

        const soloBtn = container.querySelectorAll('button')[0];
        soloBtn.click();

        const overlay = container.firstElementChild as HTMLElement;
        overlay.dispatchEvent(new Event('transitionend'));

        await choicePromise;
        expect(container.children).toHaveLength(0);
    });

    it('sets overlay opacity to 0 on button click (fade-out)', () => {
        showMainMenu(container);

        const overlay = container.firstElementChild as HTMLElement;
        const soloBtn = container.querySelectorAll('button')[0];
        soloBtn.click();

        expect(overlay.style.opacity).toBe('0');
    });
});
