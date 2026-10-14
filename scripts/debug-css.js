import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

async function debugCss() {
  const port = 9225;
  const tempDir = path.join(process.env.TEMP || 'C:\\temp', `chrome-cdp-css-${Date.now()}`);
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeArgs = [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempDir}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1536,720',
    'http://127.0.0.1:3000/evidence'
  ];

  const proc = spawn(chromePath, chromeArgs);
  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      const data = await res.json();
      wsUrl = data.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch {}
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.onopen = resolve);

  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const currentId = id++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === currentId) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: currentId, method, params }));
    });

  const target = await send('Target.createTarget', { url: 'about:blank' });
  const pageWs = new WebSocket(`ws://127.0.0.1:${port}/devtools/page/${target.targetId}`);
  await new Promise((resolve) => pageWs.onopen = resolve);

  let pid = 1;
  const sendPage = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const currentId = pid++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === currentId) {
          pageWs.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      pageWs.addEventListener('message', handler);
      pageWs.send(JSON.stringify({ id: currentId, method, params }));
    });

  await sendPage('DOM.enable');
  await sendPage('CSS.enable');
  await sendPage('Page.navigate', { url: 'http://127.0.0.1:3000/evidence' });
  await new Promise((r) => setTimeout(r, 2500));

  const doc = await sendPage('DOM.getDocument');
  const node = await sendPage('DOM.querySelector', {
    nodeId: doc.root.nodeId,
    selector: 'header'
  });
  const headerParent = await sendPage('DOM.describeNode', { nodeId: node.nodeId });
  const parentNodeId = headerParent.node.parentId;

  const matched = await sendPage('CSS.getMatchedStylesForNode', { nodeId: parentNodeId });
  
  console.log('--- MATCHED CSS RULES FOR MAIN BOX ---');
  for (const match of matched.matchedCSSRules || []) {
    console.log('Selector:', match.rule.selectorList.text);
    console.log('Origin:', match.rule.origin);
    console.log('Layers:', match.rule.layers?.map(l => l.text));
    for (const prop of match.rule.style.cssProperties) {
      if (prop.name.includes('margin')) {
        console.log(`  ${prop.name}: ${prop.value} (disabled: ${prop.disabled})`);
      }
    }
  }

  pageWs.close();
  ws.close();
  proc.kill();
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
}

debugCss().catch(console.error);
