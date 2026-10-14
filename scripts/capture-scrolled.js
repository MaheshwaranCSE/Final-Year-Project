import { runCdpCapture } from './qa-cdp.js';

runCdpCapture({
  url: 'http://127.0.0.1:3000/dashboard',
  filename: 'step4-dashboard-scrolled.png',
  width: 1536,
  height: 720,
  seedDemo: true,
  evalScript: `
    (() => {
      window.scrollTo(0, 400);
    })()
  `
}).then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
