import { runCdpCapture } from './qa-cdp.js';

runCdpCapture({
  url: 'http://127.0.0.1:3000/evidence',
  filename: 'modal-inspect.png',
  width: 1536,
  height: 720,
  seedDemo: true,
  evalScript: `
    (async () => {
      // Find and click the Ingest Evidence button
      const buttons = Array.from(document.querySelectorAll('button'));
      const ingestBtn = buttons.find(b => b.textContent && b.textContent.includes('Ingest Evidence'));
      if (ingestBtn) {
        ingestBtn.click();
        await new Promise(r => setTimeout(r, 1000));
      }

      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return { error: 'No dialog found' };

      const labels = Array.from(dialog.querySelectorAll('label')).map(l => ({
        text: l.innerText,
        className: l.className,
        computedPosition: getComputedStyle(l).position,
        computedTransform: getComputedStyle(l).transform,
        computedTop: getComputedStyle(l).top,
        computedLeft: getComputedStyle(l).left,
      }));

      const inputs = Array.from(dialog.querySelectorAll('input, select, .MuiSelect-select')).map(i => ({
        tag: i.tagName,
        value: i.value || i.innerText,
        className: i.className,
        padding: getComputedStyle(i).padding,
        border: getComputedStyle(i).border,
      }));

      const legends = Array.from(dialog.querySelectorAll('legend')).map(leg => ({
        text: leg.innerText,
        width: getComputedStyle(leg).width,
        display: getComputedStyle(leg).display
      }));

      return {
        dialogFound: true,
        dialogWidth: dialog.getBoundingClientRect().width,
        labels,
        inputs: inputs.slice(0, 10),
        legends
      };
    })()
  `
}).then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
