/**
 * Inline SVG icon strings shared across screens and HUD, in the design's
 * stroke style. All functions take a size and color and return markup.
 */

/** The robot-head profile icon. */
export function robotIcon(size: number, color: string): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="3" fill="none" stroke="${color}" stroke-width="1.6"/><circle cx="9.5" cy="11" r="1.7" fill="${color}"/><circle cx="14.5" cy="11" r="1.7" fill="${color}"/><rect x="8.5" y="15" width="7" height="1.5" rx=".7" fill="${color}"/><line x1="12" y1="2.5" x2="12" y2="5" stroke="${color}" stroke-width="1.6"/></svg>`;
}

/** Battle node icon (targeting reticle). */
export function battleIcon(size: number, color: string): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><circle cx="12" cy="12" r="6.5"/><line x1="12" y1="1.5" x2="12" y2="5.5"/><line x1="12" y1="18.5" x2="12" y2="22.5"/><line x1="1.5" y1="12" x2="5.5" y2="12"/><line x1="18.5" y1="12" x2="22.5" y2="12"/><circle cx="12" cy="12" r="1.8" fill="${color}"/></svg>`;
}

/** Elite node icon (horned skull-bot). */
export function eliteIcon(size: number, color: string): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"><path d="M12 2a7 7 0 0 0-7 7v4l-1.5 3h17L19 13V9a7 7 0 0 0-7-7zm-3 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM8 20h8a4 4 0 0 1-8 0z"/></svg>`;
}

/** Event node icon (question mark). */
export function eventIcon(size: number, color: string): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.3" stroke-linecap="round"><path d="M8.5 9a3.5 3.5 0 1 1 5.2 3c-1.2.7-1.7 1.3-1.7 2.6"/><circle cx="12" cy="18.4" r="0.4" fill="${color}" stroke="${color}"/></svg>`;
}

/** Boss node icon (big guardian head). */
export function bossIcon(size: number, color: string): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"><path d="M12 2C7.6 2 4 5.4 4 9.6c0 2.3 1 4.3 2.6 5.6V18a1 1 0 0 0 1 1H9v-1.6h1.2V19h1.2v-1.6h1.2V19H15v-1.6h1.4a1 1 0 0 0 1-1v-2.8C19 13.9 20 11.9 20 9.6 20 5.4 16.4 2 12 2zM9.2 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm5.6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>`;
}

/** Core-integrity heart. */
export function heartIcon(size: number, color: string): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6C19 16.5 12 21 12 21z"/></svg>`;
}

/** Gold coin (radial-gradient dot done in CSS, this is a ring fallback). */
export function coinHtml(size: number): string {
    return `<span style="display:inline-block;width:${size}px;height:${size}px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff2c2,#ffcf5c);box-shadow:0 0 6px #ffcf5c"></span>`;
}

/** Augment hexagon. */
export function augmentIcon(size: number, color: string): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" fill="none" stroke="${color}" stroke-width="1.8"/><circle cx="12" cy="12" r="2.6" fill="${color}"/></svg>`;
}

/** Refresh arrows. */
export function refreshIcon(size: number, color: string): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.4"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>`;
}

/** Padlock. */
export function lockIcon(size: number, color: string): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`;
}

/** Play triangle. */
export function playIcon(size: number, color: string): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"><path d="M8 5v14l11-7z"/></svg>`;
}

/** Right arrow. */
export function arrowIcon(size: number, color: string): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
}

/** Continue/resume loop arrow. */
export function resumeIcon(size: number, color: string): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>`;
}

/** Node-type icon dispatcher. */
export function nodeIcon(
    type: 'battle' | 'elite' | 'event' | 'boss',
    size: number,
    color: string,
): string {
    switch (type) {
        case 'battle':
            return battleIcon(size, color);
        case 'elite':
            return eliteIcon(size, color);
        case 'event':
            return eventIcon(size, color);
        case 'boss':
            return bossIcon(size, color);
    }
}

/** Manufacturer glyphs — small geometric marks per manufacturer. */
export function manufacturerIcon(
    id: string,
    size: number,
    color: string,
): string {
    switch (id) {
        case 'hexawatt':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><polygon points="13,2 5,13 11,13 9,22 19,10 13,10" fill="${color}"/></svg>`;
        case 'ferrocrete':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="${color}" stroke-width="1.8"/><rect x="9" y="9" width="6" height="6" fill="${color}"/></svg>`;
        case 'whisperline':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="${color}" stroke-width="1.8"/><circle cx="12" cy="12" r="2.2" fill="${color}"/><line x1="12" y1="4" x2="12" y2="9" stroke="${color}" stroke-width="1.6"/></svg>`;
        case 'scrapline':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M6 18 L6 8 L10 12 L14 5 L18 10 L18 18 Z" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
        case 'cryostat':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" stroke="${color}" stroke-width="1.8" fill="none"><line x1="12" y1="3" x2="12" y2="21"/><line x1="4" y1="7.5" x2="20" y2="16.5"/><line x1="20" y1="7.5" x2="4" y2="16.5"/></svg>`;
        default:
            return augmentIcon(size, color);
    }
}

/** Role glyphs — silhouette marks per role. */
export function roleIcon(id: string, size: number, color: string): string {
    switch (id) {
        case 'vanguard':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" fill="none" stroke="${color}" stroke-width="1.8"/></svg>`;
        case 'breacher':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" stroke="${color}" stroke-width="1.8" fill="none"><path d="M5 19 L15 5 l4 4 L9 19z"/><line x1="4" y1="20" x2="8" y2="16"/></svg>`;
        case 'gunner':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" fill="none" stroke="${color}" stroke-width="1.7"/><circle cx="12" cy="12" r="3" fill="${color}"/></svg>`;
        case 'longshot':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><polygon points="12,3 21,18 3,18" fill="none" stroke="${color}" stroke-width="1.7"/></svg>`;
        case 'swarm':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><polygon points="12,3 19,12 12,21 5,12" fill="none" stroke="${color}" stroke-width="1.7"/><circle cx="12" cy="12" r="1.8" fill="${color}"/></svg>`;
        case 'catalyst':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="${color}" stroke-width="1.7" stroke-dasharray="3 3"/><circle cx="12" cy="12" r="2.5" fill="${color}"/></svg>`;
        default:
            return augmentIcon(size, color);
    }
}

/** Star string for a unit's star level ("★★"). */
export function stars(star: number): string {
    return '★'.repeat(Math.max(1, star));
}
