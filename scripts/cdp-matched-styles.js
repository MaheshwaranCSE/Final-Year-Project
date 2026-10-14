import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const tempDir = path.join(process.env.TEMP || 'C:\\temp', `chrome-cdp-matched-${Date.now()}`);
const port = 9333;
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const proc = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${tempDir}`,
  '--disable-gpu',
  '--window-size=1536,720',
  'about:blank'
]);

for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 200));
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`);
    if (res.ok) break;
  } catch {}
}

const res = await fetch(`http://127.0.0.1:${port}/json/version`);
const { webSocketDebuggerUrl } = await res.json();
const ws = new WebSocket(webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let id = 1;
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const curId = id++;
  const handler = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id === curId) {
      ws.removeEventListener('message', handler);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };
  ws.addEventListener('message', handler);
  ws.send(JSON.stringify({ id: curId, method, params }));
});

const target = await send('Target.createTarget', { url: 'about:blank' });
const pageWs = new WebSocket(`ws://127.0.0.1:${port}/devtools/page/${target.targetId}`);
await new Promise(r => pageWs.onopen = r);

let pageId = 1;
const sendPage = (method, params = {}) => new Promise((resolve, reject) => {
  const curId = pageId++;
  const handler = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id === curId) {
      pageWs.removeEventListener('message', handler);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };
  pageWs.addEventListener('message', handler);
  pageWs.send(JSON.stringify({ id: curId, method, params }));
});

await sendPage('Page.enable');
await sendPage('DOM.enable');
await sendPage('CSS.enable');

await sendPage('Page.navigate', { url: 'http://127.0.0.1:3000/evidence' });
await new Promise(r => setTimeout(r, 2000));

// Click ingest evidence
await sendPage('Runtime.evaluate', {
  expression: `
    (async () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const ingestBtn = buttons.find(b => b.textContent && b.textContent.includes('Ingest Evidence'));
      if (ingestBtn) ingestBtn.click();
    })()
  `,
  awaitPromise: true
});
await new Promise(r => setTimeout(r, 1200));

// Find fieldset node
const doc = await sendPage('DOM.getDocument', { depth: -1 });
const fieldsetNode = await sendPage('DOM.querySelector', {
  nodeId: doc.root.nodeId,
  selector: 'fieldset'
});

const matched = await sendPage('CSS.getMatchedStylesForNode', {
  nodeId: fieldsetNode.nodeId
});

console.log('MATCHED CSS FOR FIELDSET:');
matched.matchedCSSRules.forEach(r => {
  console.log('--- RULE ---');
  console.log('Selector:', r.rule.selectorList.text);
  console.log('Origin:', r.rule.origin);
  console.log('Layers:', r.rule.layers?.map(l => l.text));
  console.log('Properties:', r.rule.style.cssProperties.filter(p => !p.disabled && ['border', 'border-width', 'border-color', 'border-style', 'padding', 'margin'].includes(p.name)).map(p => `${p.name}: ${p.value}`));
});

pageWs.close();
ws.close();
proc.kill();
try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
process.exit(0);
