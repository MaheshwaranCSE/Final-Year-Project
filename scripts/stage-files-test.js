import { runCdpCapture } from './qa-cdp.js';

runCdpCapture({
  url: 'http://127.0.0.1:3000/evidence',
  filename: 'modal-with-files-scrolled.png',
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

      const file1 = new File(['test image data content'], 'exhibit_surveillance_cam01.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test video data content'], 'dashcam_footage_north.mp4', { type: 'video/mp4' });
      
      const fileInput = document.querySelector('input[type=\"file\"]');
      if (fileInput) {
        const dt = new DataTransfer();
        dt.items.add(file1);
        dt.items.add(file2);
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(r => setTimeout(r, 1500));
      }

      const dialogContent = document.querySelector('.MuiDialogContent-root');
      if (dialogContent) {
        dialogContent.scrollTop = 380;
        await new Promise(r => setTimeout(r, 600));
      }
    })()
  `
}).then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
