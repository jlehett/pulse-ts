// Drives Overclock over CDP (trusted input) to verify: synergy hover
// tooltip + on-field trait highlight, the item-combinations overlay,
// drag-to-equip regression, and the salvage pick-1-of-3 flow.
import fs from 'node:fs';

const HTTP = 'http://127.0.0.1:9333';
const APP = 'http://localhost:5175/demos/overclock/';
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

const trustedClick = async (x, y) => {
    await mouse('mouseMoved', x, y);
    await sleep(80);
    await mouse('mousePressed', x, y, { button: 'left', buttons: 1, clickCount: 1 });
    await sleep(60);
    await mouse('mouseReleased', x, y, { button: 'left', clickCount: 1 });
    await sleep(200);
};

// Center of the first div matching a predicate body (js source string that
// receives `d` and returns boolean). Returns null if not found.
const centerOf = (predicate) =>
    evaljs(`(() => {
        const d = [...document.querySelectorAll('div')].find((d) => (${predicate})(d));
        if (!d) return null;
        const r = d.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`);

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

const fail = (msg) => { throw new Error('CHECK FAILED: ' + msg); };

// --- navigate, fresh save, into a battle prep ---
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
await waitFor(
    `window.__overclock && window.__overclock.phase === 'prep'`,
    20000,
    'prep phase',
);

// --- seed: Aegisline pair + a carry, plus tray items ---
await evaljs(`(() => {
    const s = window.__overclock;
    s.run.board.length = 0;
    s.run.board.push(
        { uid: 'a0', defId: 'chock', star: 2, row: 6, col: 2 },
        { uid: 'a1', defId: 'tripod', star: 2, row: 6, col: 4 },
        { uid: 'a2', defId: 'pellet', star: 3, row: 7, col: 3 },
    );
    s.run.items.push('cell', 'core');
    s.revision++;
    return true;
})()`);
await sleep(600);

// ── 1. Synergy hover: tooltip + on-field highlight ─────────────────────
const rowPos = await centerOf(
    `(d) => d.style.cursor === 'help' && d.textContent.includes('Aegisline')`,
);
if (!rowPos) fail('no Aegisline synergy row with cursor:help');
await mouse('mouseMoved', rowPos.x, rowPos.y);
await sleep(450);
const syn = await evaljs(`(() => {
    const tip = [...document.querySelectorAll('div')].find(
        (d) => d.style.width === '310px' && d.style.display !== 'none' &&
               d.textContent.includes('Aegisline'));
    return {
        tip: tip ? tip.innerText.slice(0, 160) : null,
        highlight: window.__overclock.highlightTrait,
    };
})()`);
console.log('synergy hover:', JSON.stringify(syn));
if (!syn.tip) fail('synergy tooltip not shown on trusted hover');
if (syn.highlight !== 'aegisline') fail('highlightTrait not set: ' + syn.highlight);
await shot('.tmp-ui2-synergy-hover.png');

// move away → tip hides, highlight clears
await mouse('mouseMoved', 640, 300);
await sleep(400);
const synOff = await evaljs(`(() => ({
    tipShown: [...document.querySelectorAll('div')].some(
        (d) => d.style.width === '310px' && d.style.display === 'block'),
    highlight: window.__overclock.highlightTrait,
}))()`);
console.log('synergy off:', JSON.stringify(synOff));
if (synOff.tipShown || synOff.highlight) fail('synergy tip/highlight did not clear');

// ── 2. Item combinations overlay ────────────────────────────────────────
const btnPos = await centerOf(
    `(d) => d.textContent.trim() === 'Item Combinations' && d.style.cursor === 'pointer'`,
);
if (!btnPos) fail('no Item Combinations button');
await trustedClick(btnPos.x, btnPos.y);
await sleep(300);
const combos = await evaljs(`(() => {
    const o = [...document.querySelectorAll('div')].find(
        (d) => d.style.zIndex === '300' && d.style.display !== 'none');
    return o ? { text: o.innerText.slice(0, 60), shown: true } : { shown: false };
})()`);
console.log('combos overlay:', JSON.stringify(combos));
if (!combos.shown || !combos.text.includes('ITEM COMBINATIONS')) {
    fail('combos overlay not shown after trusted click');
}
await shot('.tmp-ui2-combos-overlay.png');
const closePos = await centerOf(`(d) => d.textContent === '✕' && d.style.cursor === 'pointer'`);
if (!closePos) fail('no combos close button');
await trustedClick(closePos.x, closePos.y);
const combosClosed = await evaljs(
    `![...document.querySelectorAll('div')].some((d) => d.style.zIndex === '300' && d.style.display !== 'none')`,
);
console.log('combos closed:', combosClosed);
if (!combosClosed) fail('combos overlay did not close');

// ── 3. Drag-to-equip regression ─────────────────────────────────────────
let unitPos = null;
outer: for (let y = 380; y <= 720; y += 30) {
    for (let x = 500; x <= 1100; x += 34) {
        await mouse('mouseMoved', x, y);
        await sleep(30);
        if (await evaljs(`window.__overclock.hoverUid === 'a2'`)) {
            unitPos = { x, y };
            break outer;
        }
    }
}
if (!unitPos) fail('could not locate board unit a2 by hover');
console.log('unit a2 at:', JSON.stringify(unitPos));
const cellPos = await centerOf(
    `(d) => d.style.cursor === 'grab' && d.querySelector('svg')`,
);
if (!cellPos) fail('no item tray cell');
await mouse('mouseMoved', cellPos.x, cellPos.y);
await sleep(120);
await mouse('mousePressed', cellPos.x, cellPos.y, { button: 'left', buttons: 1, clickCount: 1 });
await sleep(120);
for (let i = 1; i <= 12; i++) {
    await mouse('mouseMoved',
        cellPos.x + ((unitPos.x - cellPos.x) * i) / 12,
        cellPos.y + ((unitPos.y - cellPos.y) * i) / 12,
        { buttons: 1 });
    await sleep(30);
}
await sleep(250);
await mouse('mouseReleased', unitPos.x, unitPos.y, { button: 'left', clickCount: 1 });
await sleep(300);
const equipped = await evaljs(
    `(window.__overclock.run.board.find((u) => u.uid === 'a2').items ?? []).join(',')`,
);
console.log('a2 items after drag:', equipped || '(none)');
if (!equipped) fail('drag-to-equip put no item on the unit');

// ── 4. Combat → victory → salvage pick → continue ──────────────────────
await clickText('START COMBAT');
await waitFor(
    `['victory', 'defeat'].includes(window.__overclock.phase)`,
    90000,
    'combat resolution',
);
const phase = await evaljs(`window.__overclock.phase`);
console.log('combat phase:', phase);
if (phase !== 'victory') fail('expected victory, got ' + phase);
await sleep(600);
const salvage = await evaljs(`(() => ({
    heading: document.body.innerText.includes('SALVAGE — CHOOSE 1 COMPONENT') ||
             document.body.innerText.toLowerCase().includes('choose 1 component'),
    pendingBefore: window.__overclock.run.pendingSalvage.length,
    itemsBefore: window.__overclock.run.items.length,
}))()`);
console.log('salvage picker:', JSON.stringify(salvage));
if (!salvage.heading || salvage.pendingBefore < 1) fail('salvage picker not shown');
await shot('.tmp-ui2-salvage-picker.png');
const cardPos = await centerOf(`(d) => d.style.width === '158px'`);
if (!cardPos) fail('no salvage card (width 158px)');
await trustedClick(cardPos.x, cardPos.y);
await sleep(400);
const afterPick = await evaljs(`(() => ({
    pending: window.__overclock.run.pendingSalvage.length,
    items: window.__overclock.run.items.length,
}))()`);
console.log('after pick:', JSON.stringify(afterPick));
if (afterPick.pending !== salvage.pendingBefore - 1) fail('pendingSalvage did not shrink');
if (afterPick.items !== salvage.itemsBefore + 1) fail('picked component not added to items');

// drain any remaining picks, then continue
while ((await evaljs(`window.__overclock.run.pendingSalvage.length`)) > 0) {
    const p = await centerOf(`(d) => d.style.width === '158px'`);
    if (!p) fail('remaining pick but no card');
    await trustedClick(p.x, p.y);
    await sleep(300);
}
const contPos = await centerOf(`(d) => d.textContent.trim() === 'CONTINUE'`);
if (!contPos) fail('no CONTINUE button after picks');
await trustedClick(contPos.x, contPos.y);
// The battle node unmounts on continue (window.__overclock goes stale),
// so assert the map screen itself.
await waitFor(
    `document.body.innerText.includes('CHART YOUR COURSE')`,
    10000,
    'map screen after continue',
);
console.log('back on map screen after CONTINUE');

console.log('ALL CHECKS PASSED');
ws.close();
