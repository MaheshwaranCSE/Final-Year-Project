import { runCdpCapture } from './qa-cdp.js';

runCdpCapture({
  url: 'http://127.0.0.1:3000/evidence',
  filename: 'modal-scrolled.png',
  width: 1536,
  height: 720,
  seedDemo: true,
  evalScript: `
    (async () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const ingestBtn = buttons.find(b => b.textContent && b.textContent.includes('Ingest Evidence'));
      if (ingestBtn) {
        ingestBtn.click();
        await new Promise(r => setTimeout(r, 1000));
      }

      const dialogContent = document.querySelector('.MuiDialogContent-root');
      if (dialogContent) {
        dialogContent.scrollTop = 400;
        await new Promise(r => setTimeout(r, 500));
      }
    })()
  `
}).then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
