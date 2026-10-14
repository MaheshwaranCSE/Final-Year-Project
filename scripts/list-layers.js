import { runCdpCapture } from './qa-cdp.js';

runCdpCapture({
  url: 'http://127.0.0.1:3000/evidence',
  filename: 'all-layers.png',
  width: 1536,
  height: 720,
  seedDemo: true,
  evalScript: `
    (() => {
      const layers = [];
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.constructor.name === 'CSSLayerBlockRule') {
              layers.push({
                layerName: rule.name,
                ruleCount: rule.cssRules.length,
                sample: Array.from(rule.cssRules).slice(0, 5).map(r => r.selectorText || r.name)
              });
            } else if (rule.constructor.name === 'CSSLayerStatementRule') {
              layers.push({
                statement: rule.nameList
              });
            }
          }
        } catch(e) {}
      }
      return layers;
    })()
  `
}).then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
