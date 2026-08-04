// Drives Overclock over CDP: seeds an Aegisline pair, starts combat, and
// captures screenshots to (a) verify the shield-bar fix and (b) provide a
// baseline/after view for the unit-vs-arena contrast work.
import fs from 'node:fs';

const HTTP = 'http://127.0.0.1:9333';
const APP = 'http://localhost:5175/demos/overclock/';
const TAG = process.argv[2] ?? 'base';
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
await waitFor(
    `window.__overclock && window.__overclock.phase === 'prep'`,
    20000,
    'prep phase',
);

// --- seed an Aegisline pair (chock + tripod) plus muscle ---
await evaljs(`(() => {
    const s = window.__overclock;
    s.run.board.length = 0;
    s.run.board.push(
        { uid: 'a0', defId: 'chock', star: 2, row: 6, col: 2 },
        { uid: 'a1', defId: 'tripod', star: 2, row: 6, col: 4 },
        { uid: 'a2', defId: 'pellet', star: 3, row: 7, col: 3 },
    );
    s.revision++;
    return true;
})()`);
await sleep(600);
await shot(`.tmp-contrast-prep-${TAG}.png`);
const vp = await evaljs(`({ w: innerWidth, h: innerHeight })`);
console.log('viewport:', JSON.stringify(vp));
const clip = {
    x: vp.w * 0.32,
    y: vp.h * 0.28,
    width: vp.w * 0.42,
    height: vp.h * 0.55,
};
await shot(`.tmp-contrast-prep-zoom-${TAG}.png`, clip);

// --- start combat, catch the opening moments (shield flash + bars) ---
await clickText('START COMBAT');
await waitFor(`window.__overclock.phase === 'combat'`, 10000, 'combat phase');
await sleep(450);

// shield-bar check: white shield segment must have non-zero width at full HP
const shieldBar = await evaljs(`(() => {
    const fills = [...document.querySelectorAll('[data-r="shield"]')];
    return fills.map((f) => ({
        width: f.style.width,
        left: f.style.left,
    }));
})()`);
console.log('shield bars:', JSON.stringify(shieldBar));
await shot(`.tmp-contrast-combat-open-${TAG}.png`);
await shot(`.tmp-contrast-combat-open-zoom-${TAG}.png`, {
    x: vp.w * 0.3,
    y: vp.h * 0.1,
    width: vp.w * 0.45,
    height: vp.h * 0.5,
});

await sleep(2500);
await shot(`.tmp-contrast-combat-mid-${TAG}.png`);

console.log('DONE');
ws.close();
