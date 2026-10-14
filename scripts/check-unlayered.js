import { runCdpCapture } from './qa-cdp.js';

runCdpCapture({
  url: 'http://127.0.0.1:3000/evidence',
  filename: 'check-layers.png',
  width: 1536,
  height: 720,
  seedDemo: true,
  evalScript: `
    (() => {
      const results = [];
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            // Check top level rules
            if (rule.selectorText && (rule.selectorText.includes('button') || rule.selectorText.includes('fieldset') || rule.selectorText.includes('input'))) {
              results.push({
                selector: rule.selectorText,
                cssText: rule.cssText.slice(0, 100),
                isLayer: !!rule.parentRule,
                layerName: rule.parentRule ? rule.parentRule.name : null
              });
            }
          }
        } catch(e) {}
      }
      return results;
    })()
  `
}).then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
