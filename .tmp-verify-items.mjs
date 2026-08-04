// Drives the Overclock demo over CDP (trusted input) to verify the item UI:
// tray + tooltip, drag-to-equip, auto-fuse, unit tooltip scaling rows,
// reward chip, and the victory overlay salvage line.
import fs from 'node:fs';

const HTTP = 'http://127.0.0.1:9333';
const APP = 'http://localhost:5174/demos/overclock/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const targets = await (await fetch(`${HTTP}/json`)).json();
const page = targets.find((t) => t.type === 'page');
if (!page) throw new Error('no page target');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let msgId = 0;
const pending = new Map();
ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
    }
};
const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
        const id = ++msgId;
        pending.set(id, (msg) =>
            msg.error
                ? reject(new Error(`${method}: ${JSON.stringify(msg.error)}`))
                : resolve(msg.result),
        );
        ws.send(JSON.stringify({ id, method, params }));
    });

const evaljs = async (expression) => {
    const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
    });
    if (res.exceptionDetails) {
        throw new Error(
            'eval: ' + JSON.stringify(res.exceptionDetails).slice(0, 400),
        );
    }
    return res.result.value;
};

const waitFor = async (expr, timeoutMs, label) => {
    const t0 = Date.now();
    for (;;) {
        if (await evaljs(expr)) return;
        if (Date.now() - t0 > timeoutMs) throw new Error('timeout: ' + label);
        await sleep(200);
    }
};

const shot = async (name, clip) => {
    const { data } = await send('Page.captureScreenshot', {
        format: 'png',
        ...(clip ? { clip: { ...clip, scale: 2 } } : {}),
    });
    fs.writeFileSync(name, Buffer.from(data, 'base64'));
    console.log('screenshot:', name);
};

const mouse = (type, x, y, extra = {}) =>
    send('Input.dispatchMouseEvent', { type, x, y, ...extra });

const clickText = async (text) => {
    const ok = await evaljs(`(() => {
        const c = [...document.querySelectorAll('div')].filter((d) =>
            d.textContent.includes(${JSON.stringify(text)}));
        if (!c.length) return false;
        c[c.length - 1].click();
        return true;
    })()`);
    if (!ok) throw new Error('clickText failed: ' + text);
};

// --- navigate, fresh save ---
await send('Page.enable');
await send('Page.navigate', { url: APP });
await waitFor(`document.readyState === 'complete'`, 15000, 'load');
await evaljs(`(localStorage.clear(), location.reload(), true)`);
await sleep(800);
await waitFor(
    `[...document.querySelectorAll('div')].some((d) => d.textContent.includes('NEW RUN') && d.textContent.includes('Begin a fresh'))`,
    15000,
    'main menu',
);
await clickText('Begin a fresh gauntlet');
console.log('clicked NEW RUN');

// --- map: pick first available node, embark ---
await waitFor(
    `[...document.querySelectorAll('div')].some((d) => d.style.cursor === 'pointer' && d.querySelector('[data-border]'))`,
    15000,
    'map screen',
);
await evaljs(`(() => {
    const nodes = [...document.querySelectorAll('div')].filter(
        (d) => d.style.cursor === 'pointer' && d.querySelector('[data-border]'));
    nodes[0].click();
    return true;
})()`);
await sleep(300);
await clickText('Embark');
console.log('embarked');

await waitFor(
    `window.__overclock && window.__overclock.phase === 'prep'`,
    20000,
    'prep phase (battle node)',
);

// --- seed items + a board unit ---
const seeded = await evaljs(`(() => {
    const s = window.__overclock;
    s.run.items.push('cell', 'core', 'coil');
    s.run.board.push({ uid: 'vtest', defId: 'pellet', star: 2, row: 6, col: 3 });
    s.revision++;
    return { items: s.run.items.join(','), board: s.run.board.length };
})()`);
console.log('seeded:', JSON.stringify(seeded));
await sleep(600);

// --- tray tooltip (trusted hover) ---
const cellRect = async (idx) =>
    evaljs(`(() => {
        const cells = [...document.querySelectorAll('div')].filter(
            (d) => d.style.cursor === 'grab' && d.querySelector('svg'));
        const c = cells[${idx}];
        if (!c) return null;
        const r = c.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2, count: cells.length };
    })()`);
let cr = await cellRect(0);
if (!cr) throw new Error('no tray cells found');
console.log('tray cells:', cr.count);
await mouse('mouseMoved', cr.x, cr.y);
await sleep(500);
const tip = await evaljs(`(() => {
    const t = [...document.querySelectorAll('div')].find(
        (d) => d.style.width === '264px' && d.style.display !== 'none');
    return t ? t.innerText.slice(0, 300) : null;
})()`);
console.log('item tooltip:', tip ? tip.replace(/\n/g, ' | ').slice(0, 220) : 'NOT SHOWN');
if (!tip || !/combines into/i.test(tip)) throw new Error('tray tooltip missing Combines Into');
await shot('.tmp-items-tray-tooltip.png', { x: 0, y: 340, width: 460, height: 560 });

// --- locate the board unit by hover probing ---
let unitPos = null;
outer: for (let y = 380; y <= 840; y += 34) {
    for (let x = 460; x <= 1140; x += 38) {
        await mouse('mouseMoved', x, y);
        await sleep(35);
        if (await evaljs(`window.__overclock.hoverUid === 'vtest'`)) {
            unitPos = { x, y };
            break outer;
        }
    }
}
if (!unitPos) throw new Error('could not locate board unit by hover');
console.log('unit at:', JSON.stringify(unitPos));

// --- unit tooltip BEFORE items (baseline scaling rows) ---
await sleep(400);
const baseTipHtml = await evaljs(`document.body.innerHTML.includes('Primary')`);
console.log('baseline tooltip has Primary row:', baseTipHtml);

// --- drag component 1 (cell) onto unit ---
const drag = async (fromX, fromY, toX, toY) => {
    await mouse('mouseMoved', fromX, fromY);
    await sleep(120);
    await mouse('mousePressed', fromX, fromY, { button: 'left', buttons: 1, clickCount: 1 });
    await sleep(120);
    const steps = 12;
    for (let i = 1; i <= steps; i++) {
        await mouse('mouseMoved', fromX + ((toX - fromX) * i) / steps, fromY + ((toY - fromY) * i) / steps, { buttons: 1 });
        await sleep(30);
    }
    await sleep(250);
    const hover = await evaljs(
        `({ hover: window.__overclock.hoverUid, drag: window.__overclock.dragItem })`,
    );
    console.log('pre-release:', JSON.stringify(hover));
    await mouse('mouseReleased', toX, toY, { button: 'left', clickCount: 1 });
    await sleep(300);
};

cr = await cellRect(0);
await drag(cr.x, cr.y, unitPos.x, unitPos.y);
let unitItems = await evaljs(
    `window.__overclock.run.board.find((u) => u.uid === 'vtest').items ?? []`,
);
console.log('after drag 1, unit items:', JSON.stringify(unitItems));
if (unitItems.length !== 1) throw new Error('drag-equip 1 failed');

// --- drag component 2 (core) → should auto-fuse into hybridActuator ---
cr = await cellRect(0);
await drag(cr.x, cr.y, unitPos.x, unitPos.y);
unitItems = await evaljs(
    `window.__overclock.run.board.find((u) => u.uid === 'vtest').items ?? []`,
);
console.log('after drag 2, unit items:', JSON.stringify(unitItems));
if (JSON.stringify(unitItems) !== '["hybridActuator"]') throw new Error('auto-fuse failed');
const stash = await evaljs(`window.__overclock.run.items.join(',')`);
console.log('stash remaining:', stash);

// --- unit tooltip with items: scaling rows + item slots ---
await mouse('mouseMoved', unitPos.x, unitPos.y);
await sleep(600);
const tooltipChecks = await evaljs(`(() => {
    const html = document.body.innerHTML;
    return {
        primaryRow: html.includes('Primary'),
        itemGradient: html.includes('ovcItem-hybridActuator'),
        rewardChip: document.body.innerText.includes('Item'),
    };
})()`);
console.log('unit tooltip checks:', JSON.stringify(tooltipChecks));
await shot('.tmp-items-unit-tooltip.png', { x: 1140, y: 0, width: 460, height: 640 });

// --- stack the board and fight to victory for the salvage overlay ---
await evaljs(`(() => {
    const s = window.__overclock;
    s.run.board.push(
        { uid: 'v2', defId: 'pellet', star: 3, row: 6, col: 1 },
        { uid: 'v3', defId: 'pellet', star: 3, row: 6, col: 5 },
        { uid: 'v4', defId: 'pellet', star: 3, row: 7, col: 3 },
    );
    s.revision++;
    return true;
})()`);
await sleep(400);
await clickText('START COMBAT');
console.log('combat started');
await waitFor(
    `['victory', 'defeat'].includes(window.__overclock.phase)`,
    90000,
    'combat resolution',
);
const outcome = await evaljs(`(() => {
    const s = window.__overclock;
    return {
        phase: s.phase,
        dropped: s.resolution ? s.resolution.itemsDropped : null,
        overlayHasSalvage: document.body.innerText.includes('salvaged'),
    };
})()`);
console.log('outcome:', JSON.stringify(outcome));
await sleep(500);
await shot('.tmp-items-victory-overlay.png');

console.log('ALL CHECKS DONE');
ws.close();
