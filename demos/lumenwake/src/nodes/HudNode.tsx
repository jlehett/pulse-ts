import { useOverlay } from '@pulse-ts/dom';
import type { PlayerState } from './player/LocalPlayerNode';
import type { ClassDef } from '../config/classes';
import type { GameState } from '../contexts';

export interface HudProps {
    playerState: PlayerState;
    classDef: ClassDef;
    gameState: GameState;
}

import { TOTAL_WAVES } from '../config/waves';

const SEGMENT_COUNT = 20;
const BAR_WIDTH = 400;
const ICON_SIZE = 60;
const TOTAL_WAVE_PIPS = TOTAL_WAVES;

const ABILITY_ICONS: Record<string, string> = {
    'Piercing Beam':
        `<line x1="4" y1="18" x2="32" y2="18" stroke-width="3"/>` +
        `<line x1="4" y1="18" x2="32" y2="18" stroke-width="7" opacity="0.15"/>` +
        `<circle cx="13" cy="18" r="4" stroke-width="1.5" fill="none" opacity="0.5"/>` +
        `<line x1="11" y1="14" x2="15" y2="22" stroke-width="1" opacity="0.4"/>` +
        `<circle cx="24" cy="18" r="4" stroke-width="1.5" fill="none" opacity="0.5"/>` +
        `<line x1="22" y1="14" x2="26" y2="22" stroke-width="1" opacity="0.4"/>`,
    'Photon Dash':
        `<path d="M10 18 L26 18" stroke-width="2.5"/>` +
        `<path d="M22 12 L28 18 L22 24" stroke-width="2" fill="none"/>` +
        `<path d="M6 14 L12 14" stroke-width="1.5" opacity="0.4"/>` +
        `<path d="M6 22 L12 22" stroke-width="1.5" opacity="0.4"/>` +
        `<path d="M4 18 L10 18" stroke-width="1.5" opacity="0.3"/>`,
    'Light Barrier':
        `<rect x="12" y="6" width="12" height="24" rx="2" stroke-width="2" fill="none"/>` +
        `<line x1="18" y1="10" x2="18" y2="26" stroke-width="1.5" opacity="0.4"/>`,
    Sanctuary:
        `<circle cx="18" cy="18" r="10" stroke-width="2" fill="none"/>` +
        `<line x1="18" y1="11" x2="18" y2="25" stroke-width="2"/>` +
        `<line x1="11" y1="18" x2="25" y2="18" stroke-width="2"/>`,
    'Prism Split':
        `<line x1="18" y1="14" x2="28" y2="8" stroke-width="2"/>` +
        `<line x1="18" y1="18" x2="28" y2="18" stroke-width="2"/>` +
        `<line x1="18" y1="22" x2="28" y2="28" stroke-width="2"/>` +
        `<circle cx="14" cy="18" r="4" stroke-width="1.5" fill="none"/>`,
    'Slow Field':
        `<circle cx="18" cy="18" r="12" stroke-width="2" fill="none"/>` +
        `<line x1="18" y1="8" x2="18" y2="18" stroke-width="2"/>` +
        `<line x1="18" y1="18" x2="25" y2="14" stroke-width="2"/>` +
        `<circle cx="18" cy="18" r="2" stroke-width="1.5"/>` +
        `<line x1="18" y1="6" x2="18" y2="4" stroke-width="1.5" opacity="0.5"/>` +
        `<line x1="18" y1="32" x2="18" y2="30" stroke-width="1.5" opacity="0.5"/>` +
        `<line x1="6" y1="18" x2="4" y2="18" stroke-width="1.5" opacity="0.5"/>` +
        `<line x1="32" y1="18" x2="30" y2="18" stroke-width="1.5" opacity="0.5"/>`,
};

function abilityIcon(name: string, color: string): string {
    const paths = ABILITY_ICONS[name] ?? '';
    return `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" stroke="${color}" fill="none">${paths}</svg>`,
    )}`;
}

export function HudNode(props: HudProps) {
    const { playerState, classDef, gameState } = props;
    const color = '#' + classDef.color.toString(16).padStart(6, '0');

    const style = document.createElement('style');
    style.textContent = `
        @keyframes lw-shimmer {
            0% { background-position: -400px 0; }
            100% { background-position: 400px 0; }
        }
        @keyframes lw-low-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1.0; }
        }
        @keyframes lw-timer-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.2; }
        }
        @keyframes lw-countdown-pop {
            0% { transform: translate(-50%, -50%) scale(1.4); opacity: 0.5; }
            30% { transform: translate(-50%, -50%) scale(1.0); opacity: 1.0; }
            100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.7; }
        }
    `;
    document.head.appendChild(style);

    const segments: any[] = [];
    for (let i = 0; i < SEGMENT_COUNT; i++) {
        segments.push(
            <div
                style={{
                    position: 'absolute',
                    left: `${(i / SEGMENT_COUNT) * 100}%`,
                    top: '0',
                    width: `${100 / SEGMENT_COUNT}%`,
                    height: '100%',
                    borderRight:
                        i < SEGMENT_COUNT - 1
                            ? '1px solid rgba(0, 0, 0, 0.35)'
                            : 'none',
                    boxSizing: 'border-box',
                    opacity: () => {
                        const ratio =
                            playerState.health / playerState.maxHealth;
                        const segThreshold = (i + 1) / SEGMENT_COUNT;
                        return ratio >= segThreshold ? '1' : '0.08';
                    },
                    background: () => {
                        const ratio =
                            playerState.health / playerState.maxHealth;
                        if (ratio > 0.5) return '#44dd66';
                        if (ratio > 0.25) return '#ffaa22';
                        return '#ff3333';
                    },
                    transition: 'opacity 0.2s ease-out',
                }}
            />,
        );
    }

    const ab1Icon = abilityIcon(classDef.ability1.name, color);
    const ab2Icon = abilityIcon(classDef.ability2.name, color);

    useOverlay(
        <div
            style={{
                position: 'absolute',
                inset: '0',
                pointerEvents: 'none',
            }}
        >
            {/* Big center countdown — visible during countdown and wave_clear */}
            <div
                style={{
                    position: 'absolute',
                    top: '38%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    opacity: () => {
                        const p = gameState.phase;
                        return p === 'countdown' ||
                            p === 'wave_clear' ||
                            p === 'victory' ||
                            p === 'defeat'
                            ? '1'
                            : '0';
                    },
                    visibility: () => {
                        const p = gameState.phase;
                        return p === 'countdown' ||
                            p === 'wave_clear' ||
                            p === 'victory' ||
                            p === 'defeat'
                            ? 'visible'
                            : 'hidden';
                    },
                    transition: 'opacity 0.3s ease',
                    filter: 'drop-shadow(0 4px 30px rgba(0,0,0,0.8))',
                }}
            >
                <div
                    style={{
                        font: 'bold 28px monospace',
                        letterSpacing: '10px',
                        textTransform: 'uppercase',
                        color: () => {
                            if (gameState.phase === 'victory') return '#44ff88';
                            if (gameState.phase === 'defeat') return '#ff3333';
                            if (gameState.phase === 'wave_clear')
                                return '#88bbff';
                            return '#ffcc44';
                        },
                        textShadow: () => {
                            if (gameState.phase === 'victory')
                                return '0 0 30px #44ff8866';
                            if (gameState.phase === 'defeat')
                                return '0 0 30px #ff333366';
                            if (gameState.phase === 'wave_clear')
                                return '0 0 30px #88bbff44';
                            return '0 0 30px #ffcc4444';
                        },
                    }}
                >
                    {() => {
                        if (gameState.phase === 'victory') return 'VICTORY';
                        if (gameState.phase === 'defeat') return 'DEFEATED';
                        if (gameState.phase === 'wave_clear')
                            return 'WAVE CLEAR';
                        return 'GET READY';
                    }}
                </div>
                <div
                    style={{
                        font: 'bold 120px monospace',
                        lineHeight: '1',
                        color: () => {
                            if (gameState.phase === 'victory') return '#44ff88';
                            if (gameState.phase === 'defeat') return '#ff3333';
                            return 'rgba(255, 255, 255, 0.9)';
                        },
                        textShadow: () => {
                            if (gameState.phase === 'victory')
                                return '0 0 60px #44ff8844';
                            if (gameState.phase === 'defeat')
                                return '0 0 60px #ff333344';
                            return '0 0 60px rgba(255,255,255,0.15)';
                        },
                        visibility: () => {
                            const p = gameState.phase;
                            return p === 'countdown' || p === 'wave_clear'
                                ? 'visible'
                                : 'hidden';
                        },
                    }}
                >
                    {() => Math.ceil(gameState.countdownTimer).toString()}
                </div>
                <div
                    style={{
                        font: '18px monospace',
                        letterSpacing: '5px',
                        color: 'rgba(255, 255, 255, 0.4)',
                        visibility: () =>
                            gameState.phase === 'wave_clear'
                                ? 'visible'
                                : 'hidden',
                    }}
                >
                    {() => `NEXT: WAVE ${gameState.wave + 1}`}
                </div>
            </div>

            {/* Wave counter — top center */}
            <div
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    filter: 'drop-shadow(0 2px 16px rgba(0,0,0,0.7))',
                    opacity: () => {
                        const p = gameState.phase;
                        return p === 'playing' || p === 'boss' ? '1' : '0.3';
                    },
                    transition: 'opacity 0.3s ease',
                }}
            >
                <div
                    style={{
                        font: 'bold 22px monospace',
                        letterSpacing: '6px',
                        textTransform: 'uppercase',
                        color: () => {
                            if (gameState.phase === 'boss') return '#ff6644';
                            return 'rgba(255, 255, 255, 0.7)';
                        },
                        textShadow: () => {
                            if (gameState.phase === 'boss')
                                return '0 0 20px #ff664488';
                            return '0 0 10px rgba(255,255,255,0.1)';
                        },
                    }}
                >
                    {() => {
                        if (gameState.phase === 'boss') return 'BOSS WAVE';
                        return `WAVE ${gameState.wave} / ${gameState.totalWaves}`;
                    }}
                </div>
                {/* Wave progress pips */}
                <div
                    style={{
                        display: 'flex',
                        gap: '4px',
                    }}
                >
                    {Array.from({ length: TOTAL_WAVE_PIPS }, (_, i) => (
                        <div
                            style={{
                                width: '24px',
                                height: '6px',
                                background: () => {
                                    if (i < gameState.wave - 1)
                                        return 'rgba(68, 255, 136, 0.7)';
                                    if (i === gameState.wave - 1) return color;
                                    return 'rgba(255, 255, 255, 0.15)';
                                },
                                transition: 'background 0.3s ease',
                            }}
                        />
                    ))}
                </div>
                {/* Enemies remaining */}
                <div
                    style={{
                        font: 'bold 16px monospace',
                        letterSpacing: '3px',
                        color: () => {
                            const r = gameState.enemiesRemaining;
                            const t = gameState.enemiesTotal;
                            if (t === 0) return 'rgba(255, 255, 255, 0.3)';
                            const ratio = r / t;
                            if (ratio <= 0.15) return '#44ff88';
                            if (ratio <= 0.4) return '#ffcc44';
                            return 'rgba(255, 255, 255, 0.55)';
                        },
                        textShadow: () => {
                            const r = gameState.enemiesRemaining;
                            const t = gameState.enemiesTotal;
                            if (t === 0) return 'none';
                            const ratio = r / t;
                            if (ratio <= 0.15) return '0 0 10px #44ff8844';
                            return 'none';
                        },
                        visibility: () => {
                            const p = gameState.phase;
                            return p === 'playing' || p === 'boss'
                                ? 'visible'
                                : 'hidden';
                        },
                    }}
                >
                    {() => `${gameState.enemiesRemaining} REMAINING`}
                </div>
            </div>

            {/* Match timer — top right */}
            <div
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.7))',
                }}
            >
                {/* Minutes */}
                <div
                    style={{
                        font: 'bold 28px monospace',
                        color: 'rgba(255, 255, 255, 0.75)',
                        letterSpacing: '2px',
                        textShadow: '0 0 12px rgba(255,255,255,0.1)',
                    }}
                >
                    {() => {
                        const m = Math.floor(gameState.matchTime / 60);
                        return m.toString();
                    }}
                </div>
                {/* Pulsing colon separator */}
                <div
                    style={{
                        font: 'bold 26px monospace',
                        color: 'rgba(255, 255, 255, 0.5)',
                        animation: 'lw-timer-blink 1s steps(2, start) infinite',
                        marginBottom: '2px',
                    }}
                >
                    :
                </div>
                {/* Seconds */}
                <div
                    style={{
                        font: 'bold 28px monospace',
                        color: 'rgba(255, 255, 255, 0.75)',
                        letterSpacing: '2px',
                        textShadow: '0 0 12px rgba(255,255,255,0.1)',
                    }}
                >
                    {() => {
                        const s = Math.floor(gameState.matchTime % 60);
                        return s.toString().padStart(2, '0');
                    }}
                </div>
            </div>

            {/* Damage vignette */}
            <div
                style={{
                    position: 'absolute',
                    inset: '0',
                    background:
                        'radial-gradient(ellipse at center, transparent 40%, rgba(180, 20, 10, 0.6) 100%)',
                    opacity: () => `${playerState.damageFlash}`,
                    transition: 'opacity 0.05s linear',
                }}
            />
            {/* Health bar — bottom center */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '28px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.5))',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: `${BAR_WIDTH}px`,
                        marginBottom: '5px',
                        alignItems: 'baseline',
                    }}
                >
                    <div
                        style={{
                            font: 'bold 13px monospace',
                            color: color,
                            letterSpacing: '3px',
                            textTransform: 'uppercase',
                            textShadow: `0 0 10px ${color}88`,
                        }}
                    >
                        {classDef.name}
                    </div>
                    <div
                        style={{
                            font: '13px monospace',
                            letterSpacing: '1px',
                            color: () => {
                                const ratio =
                                    playerState.health / playerState.maxHealth;
                                if (ratio > 0.5) return '#44dd66';
                                if (ratio > 0.25) return '#ffaa22';
                                return '#ff3333';
                            },
                        }}
                    >
                        {() =>
                            `${Math.ceil(playerState.health)} / ${playerState.maxHealth}`
                        }
                    </div>
                </div>

                <div
                    style={{
                        position: 'relative',
                        width: `${BAR_WIDTH}px`,
                        height: '18px',
                        clipPath:
                            'polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            inset: '0',
                            background:
                                'linear-gradient(180deg, rgba(10,10,20,0.9) 0%, rgba(5,5,15,0.95) 100%)',
                        }}
                    />
                    <div style={{ position: 'absolute', inset: '0' }}>
                        {segments}
                    </div>
                    <div
                        style={{
                            position: 'absolute',
                            inset: '0',
                            background:
                                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 100%)',
                            backgroundSize: '400px 100%',
                            animation: 'lw-shimmer 2.5s linear infinite',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '0',
                            left: '0',
                            right: '0',
                            height: '1px',
                            background:
                                'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), rgba(255,255,255,0.35), rgba(255,255,255,0.2), transparent)',
                        }}
                    />
                </div>

                <div
                    style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: `${BAR_WIDTH + 4}px`,
                        height: '22px',
                        clipPath:
                            'polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)',
                        background: () => {
                            const ratio =
                                playerState.health / playerState.maxHealth;
                            if (ratio > 0.5) return '#44dd6633';
                            if (ratio > 0.25) return '#ffaa2233';
                            return '#ff333344';
                        },
                        zIndex: '-1',
                        animation: () => {
                            const ratio =
                                playerState.health / playerState.maxHealth;
                            if (ratio <= 0.25)
                                return 'lw-low-pulse 0.8s ease-in-out infinite';
                            return 'none';
                        },
                    }}
                />
            </div>

            {/* Ability icons — bottom right */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '28px',
                    right: '28px',
                    display: 'flex',
                    gap: '8px',
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
                }}
            >
                {/* Ability 1 */}
                <div
                    style={{
                        position: 'relative',
                        width: `${ICON_SIZE}px`,
                        height: `${ICON_SIZE}px`,
                        background: 'rgba(5, 5, 15, 0.85)',
                        border: () => {
                            const cd = playerState.ability1Cooldown;
                            return !cd || cd.ready
                                ? `1px solid ${color}88`
                                : '1px solid rgba(255,255,255,0.15)';
                        },
                        overflow: 'hidden',
                    }}
                >
                    {/* Cooldown sweep — fills bottom-to-top */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.06)',
                            height: () => {
                                const cd = playerState.ability1Cooldown;
                                if (!cd || cd.ready) return '100%';
                                const total = classDef.ability1.cooldown;
                                const progress = (total - cd.remaining) / total;
                                return `${progress * 100}%`;
                            },
                            transition: 'height 0.1s linear',
                        }}
                    />
                    {/* Icon */}
                    <img
                        src={ab1Icon}
                        style={{
                            position: 'absolute',
                            inset: '6px',
                            width: `${ICON_SIZE - 12}px`,
                            height: `${ICON_SIZE - 12}px`,
                            opacity: () => {
                                const cd = playerState.ability1Cooldown;
                                return !cd || cd.ready ? '1' : '0.3';
                            },
                        }}
                    />
                    {/* Cooldown timer text */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            font: 'bold 14px monospace',
                            color: 'rgba(255, 255, 255, 0.8)',
                            visibility: () => {
                                const cd = playerState.ability1Cooldown;
                                return !cd || cd.ready ? 'hidden' : 'visible';
                            },
                        }}
                    >
                        {() => {
                            const cd = playerState.ability1Cooldown;
                            if (!cd || cd.ready) return '';
                            return cd.remaining.toFixed(0);
                        }}
                    </div>
                </div>

                {/* Ability 2 */}
                <div
                    style={{
                        position: 'relative',
                        width: `${ICON_SIZE}px`,
                        height: `${ICON_SIZE}px`,
                        background: 'rgba(5, 5, 15, 0.85)',
                        border: () => {
                            const cd = playerState.ability2Cooldown;
                            return !cd || cd.ready
                                ? `1px solid ${color}88`
                                : '1px solid rgba(255,255,255,0.15)';
                        },
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.06)',
                            height: () => {
                                const cd = playerState.ability2Cooldown;
                                if (!cd || cd.ready) return '100%';
                                const total = classDef.ability2.cooldown;
                                const progress = (total - cd.remaining) / total;
                                return `${progress * 100}%`;
                            },
                            transition: 'height 0.1s linear',
                        }}
                    />
                    <img
                        src={ab2Icon}
                        style={{
                            position: 'absolute',
                            inset: '6px',
                            width: `${ICON_SIZE - 12}px`,
                            height: `${ICON_SIZE - 12}px`,
                            opacity: () => {
                                const cd = playerState.ability2Cooldown;
                                return !cd || cd.ready ? '1' : '0.3';
                            },
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            inset: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            font: 'bold 14px monospace',
                            color: 'rgba(255, 255, 255, 0.8)',
                            visibility: () => {
                                const cd = playerState.ability2Cooldown;
                                return !cd || cd.ready ? 'hidden' : 'visible';
                            },
                        }}
                    >
                        {() => {
                            const cd = playerState.ability2Cooldown;
                            if (!cd || cd.ready) return '';
                            return cd.remaining.toFixed(0);
                        }}
                    </div>
                </div>
            </div>
        </div>,
    );
}
