import { useOverlay } from '@pulse-ts/dom';
import type { GameState, RefractionState } from '../contexts';
import type { RefractionDef } from '../config/refractions';
import { REFRACTION_POOL } from '../config/refractions';

export interface RefractionPickProps {
    gameState: GameState;
    onPick: (refraction: RefractionDef) => void;
}

function refractionIcon(def: RefractionDef): string {
    const hex = '#' + def.color.toString(16).padStart(6, '0');
    return `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" stroke="${hex}" fill="none">${def.icon}</svg>`,
    )}`;
}

function tierPips(
    refractions: RefractionState,
    defId: string,
    color: string,
): any[] {
    const pips: any[] = [];
    for (let i = 0; i < 3; i++) {
        pips.push(
            <div
                style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: () => {
                        const currentTier = refractions.active.get(defId) ?? 0;
                        return i < currentTier
                            ? color
                            : 'rgba(255,255,255,0.15)';
                    },
                    border: () => {
                        const currentTier = refractions.active.get(defId) ?? 0;
                        return i === currentTier
                            ? `1px solid ${color}`
                            : '1px solid rgba(255,255,255,0.1)';
                    },
                    transition: 'background 0.2s',
                }}
            />,
        );
    }
    return pips;
}

export function RefractionPickNode(props: RefractionPickProps) {
    const { gameState, onPick } = props;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes lw-refraction-fade-in {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes lw-refraction-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(255,255,255,0.05); }
            50% { box-shadow: 0 0 30px rgba(255,255,255,0.12); }
        }
    `;
    document.head.appendChild(style);

    const cards = REFRACTION_POOL.map((def) => {
        const hex = '#' + def.color.toString(16).padStart(6, '0');
        const hexDim = hex + '44';

        return (
            <div
                style={{
                    display: () => {
                        const choices = gameState.refractions.choices;
                        return choices.some((c) => c.id === def.id)
                            ? 'flex'
                            : 'none';
                    },
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '20px 24px',
                    background: 'rgba(5, 5, 20, 0.92)',
                    border: `1px solid ${hexDim}`,
                    width: '200px',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    animation:
                        'lw-refraction-fade-in 0.4s ease-out, lw-refraction-glow 2s ease-in-out infinite',
                    transition: 'border-color 0.2s, transform 0.15s',
                }}
                onClick={() => onPick(def)}
                onMouseenter={(e: MouseEvent) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = hex;
                    el.style.transform = 'scale(1.04)';
                }}
                onMouseleave={(e: MouseEvent) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = hexDim;
                    el.style.transform = '';
                }}
            >
                <img
                    src={refractionIcon(def)}
                    style={{
                        width: '48px',
                        height: '48px',
                    }}
                />
                <div
                    style={{
                        font: 'bold 14px monospace',
                        color: hex,
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        textShadow: `0 0 12px ${hexDim}`,
                    }}
                >
                    {def.name}
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '4px',
                        alignItems: 'center',
                    }}
                >
                    {tierPips(gameState.refractions, def.id, hex)}
                    <div
                        style={{
                            font: '11px monospace',
                            color: 'rgba(255,255,255,0.4)',
                            marginLeft: '4px',
                        }}
                    >
                        {() => {
                            const tier =
                                gameState.refractions.active.get(def.id) ?? 0;
                            if (tier >= 3) return 'MAX';
                            return `T${tier + 1}`;
                        }}
                    </div>
                </div>
                <div
                    style={{
                        font: '12px monospace',
                        color: 'rgba(255,255,255,0.65)',
                        textAlign: 'center',
                        lineHeight: '1.4',
                        minHeight: '34px',
                    }}
                >
                    {() => {
                        const tier =
                            gameState.refractions.active.get(def.id) ?? 0;
                        const nextTier = Math.min(tier, 2);
                        return def.tiers[nextTier].description;
                    }}
                </div>
            </div>
        );
    });

    useOverlay(
        <div
            style={{
                position: 'absolute',
                inset: '0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                pointerEvents: 'none',
                opacity: () =>
                    gameState.phase === 'refraction_pick' ? '1' : '0',
                visibility: () =>
                    gameState.phase === 'refraction_pick'
                        ? 'visible'
                        : 'hidden',
                transition: 'opacity 0.3s ease',
            }}
        >
            <div
                style={{
                    font: 'bold 24px monospace',
                    letterSpacing: '8px',
                    textTransform: 'uppercase',
                    color: '#88bbff',
                    textShadow: '0 0 30px #88bbff44',
                    filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.8))',
                }}
            >
                CHOOSE A REFRACTION
            </div>
            <div
                style={{
                    font: '14px monospace',
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '3px',
                }}
            >
                {() => `WAVE ${gameState.wave} COMPLETE`}
            </div>
            <div
                style={{
                    display: 'flex',
                    gap: '16px',
                    filter: 'drop-shadow(0 4px 30px rgba(0,0,0,0.7))',
                }}
            >
                {cards}
            </div>
        </div>,
    );
}
