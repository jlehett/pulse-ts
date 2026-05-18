import { createElement, Column, Row, Button } from '@pulse-ts/dom';
import { DEFAULT_MAP, type MapConfig } from '../config/maps';
import { ALL_CLASSES, type ClassDef } from '../config/classes';

export interface MenuChoice {
    mode: 'solo' | 'online';
    map: MapConfig;
    classDef: ClassDef;
}

const CLASS_COLORS: Record<string, string> = {
    shard: 'rgba(102, 221, 255, 0.35)',
    ward: 'rgba(68, 255, 136, 0.35)',
    lens: 'rgba(255, 204, 68, 0.35)',
};

const CLASS_BORDERS: Record<string, string> = {
    shard: 'rgba(102, 221, 255, 0.7)',
    ward: 'rgba(68, 255, 136, 0.7)',
    lens: 'rgba(255, 204, 68, 0.7)',
};

/**
 * Display the main menu and wait for the player to pick a class and mode.
 */
export function showMainMenu(container: HTMLElement): Promise<MenuChoice> {
    return new Promise((resolve) => {
        let selectedClass = ALL_CLASSES[0];

        function pick(mode: 'solo' | 'online') {
            container.removeChild(root);
            resolve({ mode, map: DEFAULT_MAP, classDef: selectedClass });
        }

        function selectClass(cls: ClassDef) {
            selectedClass = cls;
            const buttons = root.querySelectorAll('[data-class-id]');
            buttons.forEach((btn) => {
                const id = btn.getAttribute('data-class-id')!;
                const isSelected = id === cls.id;
                (btn as HTMLElement).style.border = isSelected
                    ? `2px solid ${CLASS_BORDERS[id]}`
                    : '1px solid rgba(255,255,255,0.15)';
                (btn as HTMLElement).style.background = isSelected
                    ? CLASS_COLORS[id]
                    : 'rgba(255,255,255,0.05)';
            });
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
                        marginBottom: '32px',
                    }}
                >
                    LUMENWAKE
                </div>

                <div
                    style={{
                        font: '14px monospace',
                        color: 'rgba(255,255,255,0.5)',
                        marginBottom: '8px',
                        letterSpacing: '2px',
                    }}
                >
                    SELECT CLASS
                </div>

                <Row gap={12}>
                    {ALL_CLASSES.map((cls) => (
                        <div
                            data-class-id={cls.id}
                            onClick={() => selectClass(cls)}
                            style={{
                                padding: '12px 20px',
                                font: 'bold 14px monospace',
                                color: '#fff',
                                background:
                                    cls.id === selectedClass.id
                                        ? CLASS_COLORS[cls.id]
                                        : 'rgba(255,255,255,0.05)',
                                border:
                                    cls.id === selectedClass.id
                                        ? `2px solid ${CLASS_BORDERS[cls.id]}`
                                        : '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                textAlign: 'center',
                                minWidth: '100px',
                            }}
                        >
                            <div style={{ marginBottom: '4px' }}>
                                {cls.name}
                            </div>
                            <div
                                style={{
                                    font: '10px monospace',
                                    color: 'rgba(255,255,255,0.4)',
                                }}
                            >
                                {cls.ability1.name}
                            </div>
                            <div
                                style={{
                                    font: '10px monospace',
                                    color: 'rgba(255,255,255,0.4)',
                                }}
                            >
                                {cls.ability2.name}
                            </div>
                        </div>
                    ))}
                </Row>

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
                            marginTop: '20px',
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
            </div>,
        );

        container.appendChild(root);
    });
}
