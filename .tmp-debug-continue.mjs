// Checks whether the live page moved to the map screen after CONTINUE.
const HTTP = 'http://127.0.0.1:9333';
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
        pending.set(id, (m) => (m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)));
        ws.send(JSON.stringify({ id, method, params }));
    });
const evaljs = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails).slice(0, 400));
    return res.result.value;
};

console.log(await evaljs(`(() => {
    const txt = document.body.innerText;
    return JSON.stringify({
        hasMapNodes: [...document.querySelectorAll('div')].some(
            (d) => d.style.cursor === 'pointer' && d.querySelector('[data-border]')),
        hasVictory: txt.includes('VICTORY'),
        hookPhase: window.__overclock ? window.__overclock.phase : null,
        snippet: txt.replace(/\\n/g, ' | ').slice(0, 140),
    });
})()`));
ws.close();
