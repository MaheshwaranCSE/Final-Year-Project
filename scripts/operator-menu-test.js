import { runCdpCapture } from './qa-cdp.js';

runCdpCapture({
  url: 'http://127.0.0.1:3000/dashboard',
  filename: 'operator-menu-open.png',
  width: 1536,
  height: 720,
  seedDemo: true,
  evalScript: `
    (async () => {
      const userBtn = Array.from(document.querySelectorAll('header button')).find(b => b.textContent && (b.textContent.includes('Marcus') || b.textContent.includes('Sarah')));
      if (userBtn) {
        userBtn.click();
        await new Promise(r => setTimeout(r, 600));
      }
    })()
  `
}).then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
