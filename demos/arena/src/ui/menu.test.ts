jest.mock('@pulse-ts/platform', () => ({
    isMobile: jest.fn(() => false),
    installMobileSupport: jest.fn(() => () => {}),
}));

import { showMainMenu, type MenuChoice } from './menu';
import { isMobile } from '@pulse-ts/platform';

const mockIsMobile = isMobile as jest.Mock;

describe('showMainMenu', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        mockIsMobile.mockReturnValue(false);
    });

    afterEach(() => {
        container.remove();
        // Clean up any injected <style> elements left by incomplete menu flows
        document.head.querySelectorAll('style').forEach((s) => s.remove());
    });

    it('renders the menu overlay into the container', () => {
        showMainMenu(container);

        const overlay = container.firstElementChild as HTMLElement;
        expect(overlay).toBeTruthy();
        expect(overlay.style.zIndex).toBe('5000');
    });

    it('displays the game title', () => {
        showMainMenu(container);

        expect(container.textContent).toContain('BUMPER');
        expect(container.textContent).toContain('BALLS');
        expect(container.textContent).toContain('ARENA');
    });

    it('displays Solo Play, Local Play, and Online Play buttons on desktop', () => {
        showMainMenu(container);

        const buttons = container.querySelectorAll('button');
        expect(buttons).toHaveLength(3);
        expect(buttons[0].textContent).toBe('Solo Play');
        expect(buttons[1].textContent).toBe('Local Play');
        expect(buttons[2].textContent).toBe('Online Play');
    });

    it('hides Local Play on mobile devices', () => {
        mockIsMobile.mockReturnValue(true);
        showMainMenu(container);

        const buttons = container.querySelectorAll('button');
        expect(buttons).toHaveLength(2);
        expect(buttons[0].textContent).toBe('Solo Play');
        expect(buttons[1].textContent).toBe('Online Play');
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

    it('resolves with "online" on mobile (second button)', async () => {
        mockIsMobile.mockReturnValue(true);
        const choicePromise = showMainMenu(container);

        // On mobile, Online is the second button (index 1)
        const onlineBtn = container.querySelectorAll('button')[1];
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

    it('applies bump animations to the title spans', () => {
        showMainMenu(container);

        const overlay = container.firstElementChild as HTMLElement;
        const title = overlay.children[0] as HTMLElement;
        const spans = title.querySelectorAll('span');
        expect(spans).toHaveLength(2);
        expect(spans[0].style.animation).toContain('bumpLeft');
        expect(spans[1].style.animation).toContain('bumpRight');
    });

    it('injects and removes the title bump stylesheet', async () => {
        const choicePromise = showMainMenu(container);

        // Style element should be in <head>
        const stylesBefore = document.head.querySelectorAll('style');
        const bumpStyle = Array.from(stylesBefore).find((s) =>
            s.textContent?.includes('bumpLeft'),
        );
        expect(bumpStyle).toBeTruthy();

        // Complete the menu selection
        const soloBtn = container.querySelectorAll('button')[0];
        soloBtn.click();
        const overlay = container.firstElementChild as HTMLElement;
        overlay.dispatchEvent(new Event('transitionend'));
        await choicePromise;

        // Style element should be removed after overlay closes
        const stylesAfter = document.head.querySelectorAll('style');
        const remaining = Array.from(stylesAfter).find((s) =>
            s.textContent?.includes('bumpLeft'),
        );
        expect(remaining).toBeFalsy();
    });

    it('applies hover glow on pointerenter', () => {
        showMainMenu(container);

        const btn = container.querySelector('button') as HTMLElement;
        btn.dispatchEvent(new Event('pointerenter'));
        expect(btn.style.boxShadow).toContain('0 0 15px');
    });
});
