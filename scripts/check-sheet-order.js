import { runCdpCapture } from './qa-cdp.js';

runCdpCapture({
  url: 'http://127.0.0.1:3000/evidence',
  filename: 'layer-order.png',
  width: 1536,
  height: 720,
  seedDemo: true,
  evalScript: `
    (() => {
      const sheets = Array.from(document.styleSheets).map(s => {
        try {
          return Array.from(s.cssRules).map(r => r.cssText.slice(0, 80));
        } catch(e) {
          return ['[CORS error]'];
        }
      });
      return sheets;
    })()
  `
}).then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
