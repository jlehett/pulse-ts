import { useFrameUpdate, useContext, useWorld } from '@pulse-ts/core';
import { useAction } from '@pulse-ts/input';
import { useThreeContext } from '@pulse-ts/three';
import { useOverlay, Column, Button } from '@pulse-ts/dom';
import { GameCtx } from '../../contexts';
import { applyStaggeredEntrance } from '../../ui/overlayAnimations';

export interface PauseMenuNodeProps {
    /** Callback invoked when the player clicks "Exit Match". */
    onRequestMenu?: () => void;
    /** When true, the overlay does not freeze the game --- it's cosmetic only. */
    online?: boolean;
}

/**
 * DOM overlay that shows a pause menu when the player presses Escape
 * during the `playing` phase. Displays "PAUSED" with Resume and
 * Exit Match buttons over a dark backdrop.
 */
export function PauseMenuNode(props?: Readonly<PauseMenuNodeProps>) {
    const gameState = useContext(GameCtx);
    const world = useWorld();
    const { renderer } = useThreeContext();
    const container = renderer.domElement.parentElement ?? document.body;
    const getPause = useAction('pause');

    // In online mode, track menu visibility locally --- never freeze the game
    let showMenu = false;

    const root = useOverlay(
        <div style={{ display: 'contents' }}>
            <div
                style={{
                    position: 'absolute',
                    inset: '0',
                    zIndex: '4500',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    transition: 'opacity 0.3s ease-in-out',
                    opacity: () => {
                        const visible = props?.online
                            ? showMenu
                            : gameState.paused;
                        return visible ? '1' : '0';
                    },
                    pointerEvents: () => {
                        const visible = props?.online
                            ? showMenu
                            : gameState.paused;
                        return visible ? 'auto' : 'none';
                    },
                }}
            />
            <Column
                center
                gap={16}
                style={{
                    position: 'absolute',
                    inset: '0',
                    zIndex: '4501',
                    transition: 'opacity 0.3s ease-in-out',
                    opacity: () => {
                        const visible = props?.online
                            ? showMenu
                            : gameState.paused;
                        return visible ? '1' : '0';
                    },
                    pointerEvents: () => {
                        const visible = props?.online
                            ? showMenu
                            : gameState.paused;
                        return visible ? 'auto' : 'none';
                    },
                }}
            >
                <div
                    style={{
                        font: 'bold clamp(28px, 8vw, 48px) monospace',
                        color: '#ffffff',
                        textShadow: '0 0 20px rgba(0,0,0,0.9)',
                        marginBottom: '16px',
                    }}
                >
                    {props?.online ? 'MENU' : 'PAUSED'}
                </div>
                <Column gap={12} style={{ alignItems: 'center' }}>
                    <Button
                        onClick={() => {
                            if (props?.online) {
                                showMenu = false;
                            } else {
                                gameState.paused = false;
                                world.setTimeScale(1);
                            }
                        }}
                        accent="#48c9b0"
                        style={{
                            font: 'bold clamp(14px, 3.5vw, 18px) monospace',
                            border: '2px solid rgba(255,255,255,0.2)',
                            borderRadius: '6px',
                            padding: '12px 32px',
                            minWidth: 'min(200px, 70vw)',
                            minHeight: '44px',
                        }}
                    >
                        Resume
                    </Button>
                    <Button
                        onClick={() => {
                            if (props?.online) {
                                showMenu = false;
                            } else {
                                gameState.paused = false;
                                world.setTimeScale(1);
                            }
                            props?.onRequestMenu?.();
                        }}
                        accent="#e74c3c"
                        style={{
                            font: 'bold clamp(14px, 3.5vw, 18px) monospace',
                            border: '2px solid rgba(255,255,255,0.2)',
                            borderRadius: '6px',
                            padding: '12px 32px',
                            minWidth: 'min(200px, 70vw)',
                            minHeight: '44px',
                        }}
                    >
                        Exit Match
                    </Button>
                </Column>
            </Column>
        </div>,
        container,
    );

    let wasVisible = false;

    useFrameUpdate(() => {
        // Toggle pause on Escape press (only during playing phase)
        const action = getPause();
        if (action.pressed) {
            if (props?.online) {
                // Online: toggle overlay without freezing the game
                showMenu = !showMenu;
            } else if (gameState.paused) {
                gameState.paused = false;
                world.setTimeScale(1);
            } else if (gameState.phase === 'playing') {
                gameState.paused = true;
                world.setTimeScale(0);
            }
        }

        const visible = props?.online ? showMenu : gameState.paused;

        if (visible && !wasVisible) {
            const rootEl = root as HTMLElement;
            const content = rootEl.children[1] as HTMLElement;
            const title = content.children[0] as HTMLElement;
            const buttonRow = content.children[1] as HTMLElement;
            applyStaggeredEntrance([title, buttonRow], 100);
        }
        wasVisible = visible;
    });
}
