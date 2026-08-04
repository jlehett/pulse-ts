// Verifies arena wheel-zoom and the custom-model brightness lift using the
// user's scrap.glb (Scrap Strays enemies are 'scrap' units).
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

const wheel = async (x, y, deltaY, times) => {
    for (let i = 0; i < times; i++) {
        await send('Input.dispatchMouseEvent', {
            type: 'mouseWheel',
            x,
            y,
            deltaX: 0,
            deltaY,
        });
        await sleep(60);
    }
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
// Let the 30MB scrap.glb finish loading + swap in.
await sleep(4000);

const vp = await evaljs(`({ w: innerWidth, h: innerHeight })`);
const cx = Math.round(vp.w / 2);
const cy = Math.round(vp.h * 0.35); // over the arena, clear of HUD panels

await shot('.tmp-zoom-default.png');
await shot('.tmp-zoom-default-enemies.png', {
    x: vp.w * 0.28,
    y: vp.h * 0.06,
    width: vp.w * 0.44,
    height: vp.h * 0.38,
});

// Zoom IN (wheel up = negative deltaY), then screenshot.
await wheel(cx, cy, -120, 6);
await sleep(700);
await shot('.tmp-zoom-in.png');

// Zoom OUT past the default to the far clamp.
await wheel(cx, cy, 120, 14);
await sleep(700);
await shot('.tmp-zoom-out.png');

// Back toward default for a sane end state.
await wheel(cx, cy, -120, 4);

console.log('DONE');
ws.close();
