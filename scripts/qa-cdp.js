import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'docs', 'ui-qa');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

export async function runCdpCapture({
  url = 'http://127.0.0.1:3000/evidence',
  filename = 'capture.png',
  width = 1536,
  height = 720,
  seedDemo = true,
  evalScript = null,
} = {}) {
  const targetPath = path.join(outDir, filename);
  const tempDir = path.join(process.env.TEMP || 'C:\\temp', `chrome-cdp-${Date.now()}`);
  const port = 9220 + Math.floor(Math.random() * 50);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeArgs = [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempDir}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--window-size=${width},${height}`,
    'about:blank'
  ];

  const proc = spawn(chromePath, chromeArgs);

  // Wait for debugger port
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

  if (!wsUrl) {
    proc.kill();
    throw new Error('Failed to connect to Chrome debugging port');
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

  try {
    // Create new target / page
    const target = await send('Target.createTarget', { url: 'about:blank' });
    const targetWsUrl = `ws://127.0.0.1:${port}/devtools/page/${target.targetId}`;

    const pageWs = new WebSocket(targetWsUrl);
    await new Promise((resolve) => pageWs.onopen = resolve);

    let pageId = 1;
    const sendPage = (method, params = {}) =>
      new Promise((resolve, reject) => {
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
    await sendPage('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });

    if (seedDemo) {
      // First go to dashboard and trigger demo data
      await sendPage('Page.navigate', { url: 'http://127.0.0.1:3000/dashboard' });
      await new Promise((r) => setTimeout(r, 2000));

      await sendPage('Runtime.evaluate', {
        expression: `
          (async () => {
            // Check if operator modal is present
            const initBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Initialize Forensic Session'));
            if (initBtn) {
              const inputs = document.querySelectorAll('input');
              if (inputs[0]) inputs[0].value = 'Detective Marcus Vance';
              if (inputs[0]) inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
              if (inputs[1]) inputs[1].value = 'FX-8821';
              if (inputs[1]) inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
              if (inputs[2]) inputs[2].value = 'Cyber & Digital Forensics Unit';
              if (inputs[2]) inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
              if (inputs[3]) inputs[3].value = 'm.vance@forensics.state.gov';
              if (inputs[3]) inputs[3].dispatchEvent(new Event('input', { bubbles: true }));
              initBtn.click();
              await new Promise(r => setTimeout(r, 800));
            }
            // Click load demo button
            const loadDemoBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Load Demo'));
            if (loadDemoBtn) {
              loadDemoBtn.click();
              await new Promise(r => setTimeout(r, 1200));
            }
          })()
        `,
        awaitPromise: true,
      });
      await new Promise((r) => setTimeout(r, 1500));

      // Now navigate to requested URL if different from dashboard
      if (url !== 'http://127.0.0.1:3000/dashboard') {
        await sendPage('Page.navigate', { url });
        await new Promise((r) => setTimeout(r, 2000));
      }
    } else {
      await sendPage('Page.navigate', { url });
      await new Promise((r) => setTimeout(r, 1500));
    }

    if (evalScript) {
      const evalRes = await sendPage('Runtime.evaluate', {
        expression: evalScript,
        returnByValue: true,
        awaitPromise: true,
      });
      console.log('Eval result:', JSON.stringify(evalRes.result?.value, null, 2));
    }

    // Capture screenshot
    const screenshot = await sendPage('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: true,
    });

    fs.writeFileSync(targetPath, Buffer.from(screenshot.data, 'base64'));
    console.log(`Saved screenshot to: ${targetPath}`);

    pageWs.close();
    ws.close();
  } finally {
    proc.kill();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

// Allow CLI execution:
if (process.argv[1] && process.argv[1].endsWith('qa-cdp.js')) {
  const url = process.argv[2] || 'http://127.0.0.1:3000/evidence';
  const filename = process.argv[3] || 'capture.png';
  const width = parseInt(process.argv[4] || '1536', 10);
  const height = parseInt(process.argv[5] || '720', 10);

  runCdpCapture({ url, filename, width, height })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
