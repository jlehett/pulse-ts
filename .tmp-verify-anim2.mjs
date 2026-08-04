// Round 2: idle wobble close-up, attack spin, and lingering death corpse
// (two enemies so combat continues after the first kill).
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

const waitFor = async (expr, timeoutMs, label, interval = 60) => {
    const t0 = Date.now();
    for (;;) {
        if (await evaljs(expr)) return;
        if (Date.now() - t0 > timeoutMs) throw new Error('timeout: ' + label);
        await sleep(interval);
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
await waitFor(`document.readyState === 'complete'`, 15000, 'load', 200);
await evaljs(`(localStorage.clear(), location.reload(), true)`);
await sleep(800);
await waitFor(
    `[...document.querySelectorAll('div')].some((d) => d.textContent.includes('Begin a fresh'))`,
    15000,
    'main menu',
    200,
);
await clickText('Begin a fresh gauntlet');
await waitFor(
    `[...document.querySelectorAll('div')].some((d) => d.style.cursor === 'pointer' && d.querySelector('[data-border]'))`,
    15000,
    'map screen',
    200,
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
    200,
);

// Player pellet mid-board; weak enemy adjacent (dies fast) + tanky enemy
// far away (keeps combat alive so the corpse linger is observable).
await evaljs(`(() => {
    const s = window.__overclock;
    s.run.board.length = 0;
    s.run.board.push({ uid: 'a0', defId: 'pellet', star: 3, row: 4, col: 3 });
    s.wave.placements.length = 0;
    s.wave.placements.push(
        { uid: 'e0', defId: 'pellet', star: 1, row: 3, col: 3 },
        { uid: 'e1', defId: 'tripod', star: 3, row: 3, col: 4 },
    );
    s.revision++;
    return true;
})()`);
await sleep(1000);

const vp = await evaljs(`({ w: innerWidth, h: innerHeight })`);
const clip = {
    x: vp.w * 0.32,
    y: vp.h * 0.2,
    width: vp.w * 0.36,
    height: vp.h * 0.55,
};

await shot('.tmp-anim2-idle-a.png', clip);
await sleep(300);
await shot('.tmp-anim2-idle-b.png', clip);

await clickText('START COMBAT');
await waitFor(`window.__overclock.phase === 'combat'`, 10000, 'combat');

// Attack spin: fire as soon as the weak enemy has taken damage.
await waitFor(
    `(() => { const c = window.__overclock.combat; if (!c) return false;
       const e = c.byUid.get('e0'); return !!e && e.hp < e.maxHp; })()`,
    15000,
    'first hit',
);
await shot('.tmp-anim2-attack.png', clip);

// Death linger: shoot immediately after e0 goes down (0.8s clip).
await waitFor(
    `(() => { const c = window.__overclock.combat; if (!c) return false;
       const e = c.byUid.get('e0'); return !!e && !e.alive; })()`,
    20000,
    'e0 death',
);
await shot('.tmp-anim2-death.png', clip);
await sleep(300);
await shot('.tmp-anim2-death-b.png', clip);
await sleep(1500);
await shot('.tmp-anim2-after-linger.png', clip);

console.log('DONE');
ws.close();
