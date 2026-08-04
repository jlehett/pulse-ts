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
        case 'aegisline':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" fill="none" stroke="${color}" stroke-width="1.8"/><line x1="8" y1="10.5" x2="16" y2="10.5" stroke="${color}" stroke-width="1.8"/></svg>`;
        case 'redline':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round"><path d="M5 5l7 7-7 7"/><path d="M13 5l7 7-7 7"/></svg>`;
        case 'blacksite':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M14 3a9 9 0 1 0 7 14A9.5 9.5 0 0 1 14 3z" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
        case 'blastworks':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M12 2l1.8 6.2L20 6l-4.2 4.6L22 12l-6.2 1.4L20 18l-6.2-2.2L12 22l-1.8-6.2L4 18l4.2-4.6L2 12l6.2-1.4L4 6l6.2 2.2z" fill="${color}"/></svg>`;
        case 'hardlight':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><polygon points="12,3 20,12 12,21 4,12" fill="none" stroke="${color}" stroke-width="1.7"/><polygon points="12,8 15.5,12 12,16 8.5,12" fill="${color}"/></svg>`;
        case 'vulture':
            // Scavenger talon: hooked claw curling over a picked-clean bone.
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.9" stroke-linecap="round"><path d="M6 3c5 1 9 5 10 10l2 8"/><path d="M16 13c-2 1-5 1-7-1"/><path d="M18 21l-4-2"/></svg>`;
        case 'surgecore':
            // Overdriven bolt inside a reactor ring.
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="${color}" stroke-width="1.6" stroke-dasharray="4 2.5"/><path d="M13 5l-5 8h3.5L11 19l5-8h-3.5z" fill="${color}"/></svg>`;
        default:
            return augmentIcon(size, color);
    }
}

/** Role glyphs — silhouette marks per role. */
export function roleIcon(id: string, size: number, color: string): string {
    switch (id) {
        case 'turret':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8"><path d="M5 20h14M7 20v-5h10v5"/><rect x="9" y="10" width="6" height="5" fill="${color}" stroke="none"/><line x1="12" y1="10" x2="12" y2="3"/><line x1="15" y1="10" x2="19" y2="5"/></svg>`;
        case 'flanker':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"><path d="M4 20 L16 4l4 3L8 20z"/><line x1="3" y1="21" x2="7" y2="17"/></svg>`;
        case 'bulwark':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" fill="none" stroke="${color}" stroke-width="1.8"/><circle cx="12" cy="11" r="2.2" fill="${color}"/></svg>`;
        case 'medic':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
        case 'bombardier':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><circle cx="10.5" cy="14" r="6.5" fill="none" stroke="${color}" stroke-width="1.8"/><path d="M14.5 8.5L18 5" stroke="${color}" stroke-width="1.8" fill="none"/><circle cx="19" cy="4" r="1.6" fill="${color}"/></svg>`;
        case 'amplifier':
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8"><circle cx="12" cy="12" r="2" fill="${color}" stroke="none"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9"/><path d="M4.5 4.5a10.6 10.6 0 0 0 0 15M19.5 4.5a10.6 10.6 0 0 1 0 15"/></svg>`;
        case 'juggernaut':
            // Anvil block with a rising repair pulse.
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"><rect x="5" y="12" width="14" height="7" rx="1.5"/><path d="M8 12V8a4 4 0 0 1 8 0v4"/><path d="M8.5 15.5h2l1-1.6 1.5 3 1-1.4h1.5" stroke-linecap="round"/></svg>`;
        case 'breaker':
            // Cracked plate split by a wedge.
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"><path d="M5 4h14v16H5z"/><path d="M12 4l-2.5 6 3.5 3-2.5 7" stroke-linecap="round"/><path d="M12 4l3 5-2 3.5 3 5" stroke-linecap="round" opacity="0.55"/></svg>`;
        case 'reaper':
            // Crescent scythe blade.
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.9" stroke-linecap="round"><path d="M4 6c6-4 13-2 16 3-4-1-9 0-12 3"/><path d="M11 8l6 13"/></svg>`;
        default:
            return augmentIcon(size, color);
    }
}

/** Prime glyph — crown mark shared by all Prime traits. */
export function primeIcon(size: number, color: string): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M4 18L3 7l5 4 4-7 4 7 5-4-1 11z" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="14.5" r="1.6" fill="${color}"/></svg>`;
}

/** Trait-icon dispatcher across all three trait axes. */
export function traitIcon(
    axis: 'manufacturer' | 'role' | 'prime',
    id: string,
    size: number,
    color: string,
): string {
    switch (axis) {
        case 'manufacturer':
            return manufacturerIcon(id, size, color);
        case 'role':
            return roleIcon(id, size, color);
        case 'prime':
            return primeIcon(size, color);
    }
}

/** Star string for a unit's star level ("★★"). */
export function stars(star: number): string {
    return '★'.repeat(Math.max(1, star));
}
