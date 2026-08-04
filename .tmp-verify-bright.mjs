// Seeds the scrap GLB unit on the board and shoots a close-up, to tune
// custom-model brightness. Pass a suffix arg to label the screenshot.
import fs from 'node:fs';

const suffix = process.argv[2] ?? 'x';
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

await send('Page.enable');
await send('Page.navigate', { url: APP });
await waitFor(`document.readyState === 'complete'`, 15000, 'load');
await evaljs(`(localStorage.clear(), location.reload(), true)`);
await sleep(800);
await waitFor(
    `[...document.querySelectorAll('div')].some((d) => d.textContent.includes('Begin a fresh'))`,
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

await evaljs(`(() => {
    const s = window.__overclock;
    s.run.board.length = 0;
    s.run.board.push(
        { uid: 'a0', defId: 'scrap', star: 2, row: 6, col: 2 },
        { uid: 'a1', defId: 'scrap', star: 2, row: 6, col: 4 },
    );
    s.wave.placements.length = 0;
    s.wave.placements.push({ uid: 'e0', defId: 'scrap', star: 2, row: 2, col: 3 });
    s.revision++;
    return true;
})()`);
await sleep(1800);

const vp = await evaljs(`({ w: innerWidth, h: innerHeight })`);
await shot(`.tmp-bright-${suffix}.png`, {
    x: vp.w * 0.22,
    y: vp.h * 0.22,
    width: vp.w * 0.56,
    height: vp.h * 0.6,
});

console.log('DONE');
ws.close();
