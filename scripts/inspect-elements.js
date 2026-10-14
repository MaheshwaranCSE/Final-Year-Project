import { runCdpCapture } from './qa-cdp.js';

runCdpCapture({
  url: 'http://127.0.0.1:3000/evidence',
  filename: 'inspect-fieldset.png',
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

      const fieldset = document.querySelector('fieldset');
      const outlinedInput = document.querySelector('.MuiOutlinedInput-root');
      const dialogActions = document.querySelector('.MuiDialogActions-root');
      const submitBtn = dialogActions ? dialogActions.querySelectorAll('button')[1] : null;

      function getStyles(el) {
        if (!el) return null;
        const cs = getComputedStyle(el);
        return {
          tagName: el.tagName,
          className: el.className,
          border: cs.border,
          borderColor: cs.borderColor,
          borderWidth: cs.borderWidth,
          borderStyle: cs.borderStyle,
          backgroundColor: cs.backgroundColor,
          color: cs.color,
          padding: cs.padding,
          margin: cs.margin,
          position: cs.position,
          display: cs.display,
          width: cs.width,
          height: cs.height,
        };
      }

      return {
        fieldset: getStyles(fieldset),
        outlinedInput: getStyles(outlinedInput),
        submitBtn: getStyles(submitBtn)
      };
    })()
  `
}).then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
