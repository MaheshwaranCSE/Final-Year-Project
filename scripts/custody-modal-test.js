import { runCdpCapture } from './qa-cdp.js';

runCdpCapture({
  url: 'http://127.0.0.1:3000/custody',
  filename: 'custody-modal.png',
  width: 1536,
  height: 720,
  seedDemo: true,
  evalScript: `
    (async () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const recordBtn = buttons.find(b => b.textContent && b.textContent.includes('Record Custody Transfer'));
      if (recordBtn) {
        recordBtn.click();
        await new Promise(r => setTimeout(r, 800));
      }
    })()
  `
}).then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
