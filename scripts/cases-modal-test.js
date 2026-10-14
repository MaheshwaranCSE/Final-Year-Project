import { runCdpCapture } from './qa-cdp.js';

runCdpCapture({
  url: 'http://127.0.0.1:3000/cases',
  filename: 'cases-modal.png',
  width: 1536,
  height: 720,
  seedDemo: true,
  evalScript: `
    (async () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const newCaseBtn = buttons.find(b => b.textContent && b.textContent.includes('New Case'));
      if (newCaseBtn) {
        newCaseBtn.click();
        await new Promise(r => setTimeout(r, 800));
      }
    })()
  `
}).then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
