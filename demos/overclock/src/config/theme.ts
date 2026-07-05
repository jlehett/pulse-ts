/**
 * The "holo" visual theme for Overclock, lifted from the imported design.
 *
 * CSS-facing values are strings; three.js-facing values are hex numbers.
 * Keep both in sync when tweaking colors.
 */
export const THEME = {
    /** Page / scene background. */
    bg: '#070d14',
    bgNum: 0x070d14,
    /** Translucent HUD panel background. */
    panel: 'rgba(13,26,36,.72)',
    panelSolid: 'rgba(13,26,36,.92)',
    /** Panel border line color. */
    line: '#1d3a4a',
    /** Primary body text. */
    text: '#dbeff7',
    /** Muted label text. */
    dim: '#6f93a3',
    dimmer: '#5b7387',
    /** Primary accent (cyan). */
    accent: '#38e8ff',
    accentNum: 0x38e8ff,
    /** Ally identity color. */
    ally: '#33d6ff',
    allyNum: 0x33d6ff,
    /** Enemy identity color. */
    enemy: '#ff5d6c',
    enemyNum: 0xff5d6c,
    /** Gold / currency color. */
    gold: '#ffcf5c',
    goldNum: 0xffcf5c,
    /** Elite / event purple. */
    arcane: '#b45cff',
    arcaneNum: 0xb45cff,
    /** Boss red. */
    boss: '#ff4d5e',
    bossNum: 0xff4d5e,
    /** Success green. */
    good: '#2fbf6f',
    goodNum: 0x2fbf6f,
    /** Dark text used on bright accent buttons. */
    inkOnAccent: '#05141d',
    /** Scene environment metal color. */
    envNum: 0x0a141c,
    tileAllyNum: 0x0e1a24,
    tileEnemyNum: 0x141a20,
} as const;

/** Font stacks matching the design (loaded in index.html). */
export const FONTS = {
    body: "'Rajdhani', system-ui, sans-serif",
    display: "'Teko', 'Rajdhani', sans-serif",
    mono: "'JetBrains Mono', monospace",
} as const;

/**
 * Returns a CSS `clip-path` polygon that bevels two opposite corners — the
 * signature panel silhouette from the design.
 *
 * @param px - Bevel size in pixels.
 * @returns A CSS clip-path string.
 */
export function bevel(px: number): string {
    return `polygon(${px}px 0,100% 0,100% calc(100% - ${px}px),calc(100% - ${px}px) 100%,0 100%,0 ${px}px)`;
}

/** Hexagon clip-path used for icons/markers. */
export const HEX_CLIP = 'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)';
