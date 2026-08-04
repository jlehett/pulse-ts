// Verifies custom-model animations over CDP: pellet test box should
// scale-wobble at idle, lean while walking, spin on attack, and tip over
// (lingering corpse) on death.
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
const errors = [];
ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.method === 'Runtime.exceptionThrown') {
        errors.push(JSON.stringify(msg.params).slice(0, 300));
    }
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
        await sleep(150);
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
await send('Runtime.enable');
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

// Strong player pellet far from a weak enemy pellet: box must walk across
// the board, attack, and kill (death clip on the enemy corpse).
await evaljs(`(() => {
    const s = window.__overclock;
    s.run.board.length = 0;
    s.run.board.push({ uid: 'a0', defId: 'pellet', star: 3, row: 7, col: 3 });
    s.wave.placements.length = 0;
    s.wave.placements.push({ uid: 'e0', defId: 'pellet', star: 1, row: 0, col: 3 });
    s.revision++;
    return true;
})()`);
await sleep(1200);

const vp = await evaljs(`({ w: innerWidth, h: innerHeight })`);
const clip = {
    x: vp.w * 0.28,
    y: vp.h * 0.15,
    width: vp.w * 0.44,
    height: vp.h * 0.7,
};

// Idle wobble: two frames ~0.35s apart should show different squash.
await shot('.tmp-anim-idle-a.png', clip);
await sleep(350);
await shot('.tmp-anim-idle-b.png', clip);

await clickText('START COMBAT');
await waitFor(`window.__overclock.phase === 'combat'`, 10000, 'combat phase');

// Walk: capture while the player pellet is still moving toward the enemy.
await sleep(700);
await shot('.tmp-anim-walk.png', clip);

// Death: poll for the enemy going down, then shoot the lingering corpse.
await waitFor(
    `(() => { const c = window.__overclock.combat; return !!c && c.units.some((u) => u.team === 'enemy' && !u.alive); })()`,
    30000,
    'enemy death',
);
await sleep(400);
await shot('.tmp-anim-death.png', clip);

console.log('page errors:', errors.length ? errors : 'none');
console.log('DONE');
ws.close();
