import { runCdpCapture } from './qa-cdp.js';

runCdpCapture({
  url: 'http://127.0.0.1:3000/evidence',
  filename: 'fieldset-source.png',
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
      if (!fieldset) return { error: 'No fieldset' };

      const allMatchingRules = [];

      function checkRule(rule, layerName) {
        if (rule.selectorText && fieldset.matches(rule.selectorText)) {
          allMatchingRules.push({
            layer: layerName,
            selector: rule.selectorText,
            border: rule.style.border,
            borderWidth: rule.style.borderWidth,
            borderColor: rule.style.borderColor,
            cssText: rule.cssText
          });
        }
        if (rule.cssRules) {
          for (const subRule of rule.cssRules) {
            checkRule(subRule, rule.name || layerName);
          }
        }
      }

      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            checkRule(rule, 'root');
          }
        } catch(e) {}
      }

      return {
        allMatchingRules
      };
    })()
  `
}).then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
