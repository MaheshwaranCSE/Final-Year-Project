import { runCdpCapture } from './qa-cdp.js';

runCdpCapture({
  url: 'http://127.0.0.1:3000/evidence',
  filename: 'matched-rules.png',
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

      const input = document.querySelector('.MuiOutlinedInput-input');
      if (!input) return { error: 'No MuiOutlinedInput-input found' };

      // Check all style sheets and matched rules
      const matched = [];
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText && input.matches(rule.selectorText)) {
              matched.push({
                selector: rule.selectorText,
                cssText: rule.cssText,
                layer: rule.parentRule ? rule.parentRule.name : (rule.parentStyleSheet ? 'sheet' : 'unknown')
              });
            }
          }
        } catch (e) {}
      }

      return {
        matched,
        computed: {
          padding: getComputedStyle(input).padding,
          paddingTop: getComputedStyle(input).paddingTop,
          paddingBottom: getComputedStyle(input).paddingBottom,
          paddingLeft: getComputedStyle(input).paddingLeft,
          paddingRight: getComputedStyle(input).paddingRight,
          border: getComputedStyle(input).border,
          height: getComputedStyle(input).height,
          boxSizing: getComputedStyle(input).boxSizing
        }
      };
    })()
  `
}).then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
