import { runCdpCapture } from './qa-cdp.js';

runCdpCapture({
  url: 'http://127.0.0.1:3000/evidence',
  filename: 'input-padding-source.png',
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
      if (!input) return { error: 'No input found' };

      // Check all style tags in document.head
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(s => ({
        tag: s.tagName,
        id: s.id,
        dataEmotion: s.getAttribute('data-emotion'),
        textLength: s.innerText?.length || 0,
        textSample: s.innerText?.slice(0, 150) || ''
      }));

      // Find where padding: 0 is coming from
      // We can inspect document.styleSheets
      const paddingRules = [];
      for (const sheet of document.styleSheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule.cssText && rule.cssText.includes('padding') && input.matches(rule.selectorText || '')) {
              paddingRules.push({
                selector: rule.selectorText,
                cssText: rule.cssText,
                parentLayer: rule.parentRule ? rule.parentRule.name : 'root'
              });
            }
          }
        } catch(e) {}
      }

      return {
        styles,
        paddingRules
      };
    })()
  `
}).then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
