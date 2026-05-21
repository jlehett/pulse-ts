import { useOverlay } from '@pulse-ts/dom';
import type { GameState } from '../contexts';
import type { RefractionDef } from '../config/refractions';
import { REFRACTION_POOL } from '../config/refractions';
import { TOTAL_WAVES } from '../config/waves';

export interface DebugMenuProps {
    gameState: GameState;
    onApplyRefraction: (def: RefractionDef) => void;
    onStartWave: (index: number) => void;
}

function refractionIcon(def: RefractionDef): string {
    const hex = '#' + def.color.toString(16).padStart(6, '0');
    return `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" stroke="${hex}" fill="none">${def.icon}</svg>`,
    )}`;
}

export function DebugMenuNode(props: DebugMenuProps): void {
    const { gameState } = props;
    let activePanel: 'none' | 'refractions' | 'waves' = 'none';

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Backquote') {
            activePanel =
                activePanel === 'refractions' ? 'none' : 'refractions';
            e.preventDefault();
        } else if (e.code === 'F2') {
            activePanel = activePanel === 'waves' ? 'none' : 'waves';
            e.preventDefault();
        }
    };
    document.addEventListener('keydown', handleKeyDown);

    const refractionCards = REFRACTION_POOL.map((def) => {
        const hex = '#' + def.color.toString(16).padStart(6, '0');
        return (
            <div
                onClick={() => props.onApplyRefraction(def)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: () => {
                        const tier =
                            gameState.refractions.active.get(def.id) ?? 0;
                        return tier >= 3
                            ? `1px solid ${hex}`
                            : '1px solid rgba(255,255,255,0.1)';
                    },
                    opacity: () => {
                        const tier =
                            gameState.refractions.active.get(def.id) ?? 0;
                        return tier >= 3 ? '0.5' : '1';
                    },
                }}
            >
                <img
                    src={refractionIcon(def)}
                    style={{ width: '28px', height: '28px' }}
                />
                <div style={{ flex: '1', minWidth: '0' }}>
                    <div
                        style={{
                            color: hex,
                            fontSize: '13px',
                            fontWeight: '600',
                        }}
                    >
                        {def.name}
                    </div>
                    <div
                        style={{
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: '11px',
                        }}
                    >
                        {() => {
                            const tier =
                                gameState.refractions.active.get(def.id) ?? 0;
                            if (tier >= 3) return 'MAX';
                            return def.tiers[tier].description;
                        }}
                    </div>
                </div>
                <div
                    style={{
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '700',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        padding: '2px 8px',
                    }}
                >
                    {() => {
                        const tier =
                            gameState.refractions.active.get(def.id) ?? 0;
                        return tier >= 3 ? 'MAX' : `T${tier}`;
                    }}
                </div>
            </div>
        );
    });

    const waveButtons: any[] = [];
    for (let i = 0; i < TOTAL_WAVES; i++) {
        const waveIndex = i;
        waveButtons.push(
            <div
                onClick={() => props.onStartWave(waveIndex)}
                style={{
                    padding: '12px 20px',
                    background: () =>
                        gameState.wave === waveIndex + 1
                            ? 'rgba(100,180,255,0.25)'
                            : 'rgba(255,255,255,0.06)',
                    border: () =>
                        gameState.wave === waveIndex + 1
                            ? '1px solid rgba(100,180,255,0.6)'
                            : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    textAlign: 'center',
                }}
            >
                {waveIndex === TOTAL_WAVES - 1
                    ? `Wave ${waveIndex + 1} (Boss)`
                    : `Wave ${waveIndex + 1}`}
            </div>,
        );
    }

    useOverlay(
        <div
            style={{
                position: 'absolute',
                inset: '0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: () => (activePanel !== 'none' ? 'auto' : 'none'),
                opacity: () => (activePanel !== 'none' ? '1' : '0'),
                visibility: () =>
                    activePanel !== 'none' ? 'visible' : 'hidden',
                transition: 'opacity 0.15s ease',
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                zIndex: '9999',
                background: () =>
                    activePanel !== 'none' ? 'rgba(0,0,0,0.4)' : 'transparent',
            }}
        >
            <div
                style={{
                    background: 'rgba(10,10,20,0.92)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '20px',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    minWidth: '320px',
                    maxWidth: '420px',
                }}
            >
                <div
                    style={{
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '10px',
                        fontWeight: '700',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        marginBottom: '14px',
                        textAlign: 'center',
                    }}
                >
                    {() =>
                        activePanel === 'refractions'
                            ? 'Debug: Refractions  [ ` to close ]'
                            : 'Debug: Waves  [ F2 to close ]'
                    }
                </div>

                {/* Refractions panel */}
                <div
                    style={{
                        display: () =>
                            activePanel === 'refractions' ? 'flex' : 'none',
                        flexDirection: 'column',
                        gap: '6px',
                    }}
                >
                    {refractionCards}
                </div>

                {/* Waves panel */}
                <div
                    style={{
                        display: () =>
                            activePanel === 'waves' ? 'grid' : 'none',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                    }}
                >
                    {waveButtons}
                </div>
            </div>
        </div>,
    );
}
