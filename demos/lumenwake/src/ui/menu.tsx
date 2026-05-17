import { createElement, Column, Button } from '@pulse-ts/dom';

export interface MenuChoice {
    mode: 'solo' | 'online';
}

/**
 * Display the main menu and wait for the player to pick a mode.
 */
export function showMainMenu(container: HTMLElement): Promise<MenuChoice> {
    return new Promise((resolve) => {
        const { root } = createElement(
            <div
                style={{
                    position: 'absolute',
                    inset: '0',
                    zIndex: '5000',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '20px',
                    backgroundColor: 'rgba(2, 2, 6, 0.85)',
                }}
            >
                <div
                    style={{
                        font: 'bold 48px monospace',
                        color: '#fff',
                        textShadow:
                            '0 0 30px rgba(100, 200, 255, 0.8), 0 0 60px rgba(100, 200, 255, 0.4)',
                        letterSpacing: '6px',
                        marginBottom: '40px',
                    }}
                >
                    LUMENWAKE
                </div>
                <Column gap={12}>
                    <Button
                        label="Solo"
                        onClick={() => {
                            container.removeChild(root);
                            resolve({ mode: 'solo' });
                        }}
                        style={{
                            padding: '14px 48px',
                            font: 'bold 18px monospace',
                            color: '#fff',
                            background:
                                'linear-gradient(135deg, rgba(0,200,255,0.3), rgba(0,100,200,0.3))',
                            border: '1px solid rgba(100,200,255,0.5)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    />
                    <Button
                        label="Online Co-op"
                        onClick={() => {
                            container.removeChild(root);
                            resolve({ mode: 'online' });
                        }}
                        style={{
                            padding: '14px 48px',
                            font: 'bold 18px monospace',
                            color: '#fff',
                            background:
                                'linear-gradient(135deg, rgba(200,0,255,0.3), rgba(100,0,200,0.3))',
                            border: '1px solid rgba(200,100,255,0.5)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    />
                </Column>
            </div>,
        );

        container.appendChild(root);
    });
}
