import { runCdpCapture } from './qa-cdp.js';

runCdpCapture({
  url: 'http://127.0.0.1:3000/dashboard',
  filename: 'operator-modal.png',
  width: 1536,
  height: 720,
  seedDemo: true,
  evalScript: `
    (async () => {
      const topBarBtn = document.querySelector('header button[title*=\"Switch\"]') || Array.from(document.querySelectorAll('header button')).find(b => b.textContent && b.textContent.includes('Special Agent'));
      if (topBarBtn) {
        topBarBtn.click();
        await new Promise(r => setTimeout(r, 800));
      }
    })()
  `
}).then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
