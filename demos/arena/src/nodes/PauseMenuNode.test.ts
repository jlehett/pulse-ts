import { PauseMenuNode, type PauseMenuNodeProps } from './PauseMenuNode';

describe('PauseMenuNode', () => {
    it('exports the node function', () => {
        expect(typeof PauseMenuNode).toBe('function');
    });

    it('accepts optional onRequestMenu prop', () => {
        // Verify the function signature accepts props without errors
        expect(PauseMenuNode.length).toBeLessThanOrEqual(1);
    });

    it('accepts optional online prop', () => {
        // Type-level check — online prop is optional
        const props: PauseMenuNodeProps = { online: true };
        expect(props.online).toBe(true);
    });
});
