// Close-up screenshot of the scrap enemies on the live page (assumes prep).
import fs from 'node:fs';

const HTTP = 'http://127.0.0.1:9333';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const targets = await (await fetch(`${HTTP}/json`)).json();
const page = targets.find((t) => t.type === 'page');
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
            msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result),
        );
        ws.send(JSON.stringify({ id, method, params }));
    });
const evaljs = async (expression) =>
    (await send('Runtime.evaluate', { expression, returnByValue: true })).result.value;

const vp = await evaljs(`({ w: innerWidth, h: innerHeight })`);
const cx = Math.round(vp.w / 2);
const cy = Math.round(vp.h * 0.35);
for (let i = 0; i < 7; i++) {
    await send('Input.dispatchMouseEvent', {
        type: 'mouseWheel', x: cx, y: cy, deltaX: 0, deltaY: -120,
    });
    await sleep(60);
}
await sleep(800);
const { data } = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: vp.w * 0.3, y: 0, width: vp.w * 0.45, height: vp.h * 0.4, scale: 2.5 },
});
fs.writeFileSync('.tmp-scrap-closeup.png', Buffer.from(data, 'base64'));
console.log('DONE');
ws.close();
