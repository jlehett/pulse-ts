import { createElement, Column, Button } from '@pulse-ts/dom';
import { ALL_MAPS, type MapConfig } from '../config/maps';

export interface MenuChoice {
    mode: 'solo' | 'online';
    map: MapConfig;
}

/**
 * Display the main menu and wait for the player to pick a mode and map.
 */
export function showMainMenu(container: HTMLElement): Promise<MenuChoice> {
    return new Promise((resolve) => {
        let selectedMap = ALL_MAPS[0];

        function pick(mode: 'solo' | 'online') {
            container.removeChild(root);
            resolve({ mode, map: selectedMap });
        }

        function cycleMap() {
            const idx = ALL_MAPS.indexOf(selectedMap);
            selectedMap = ALL_MAPS[(idx + 1) % ALL_MAPS.length];
            const label = root.querySelector('#map-label');
            if (label) label.textContent = selectedMap.name;
        }

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
                        onClick={() => pick('solo')}
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
                    >
                        Solo
                    </Button>
                    <Button
                        onClick={() => pick('online')}
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
                    >
                        Online Co-op
                    </Button>
                </Column>
                <div
                    style={{
                        marginTop: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    <span
                        style={{
                            font: '14px monospace',
                            color: 'rgba(255,255,255,0.5)',
                        }}
                    >
                        MAP:
                    </span>
                    <Button
                        onClick={cycleMap}
                        style={{
                            padding: '8px 20px',
                            font: 'bold 14px monospace',
                            color: '#fff',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        <span id="map-label">{selectedMap.name}</span>
                    </Button>
                </div>
            </div>,
        );

        container.appendChild(root);
    });
}
