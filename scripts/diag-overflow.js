import { runCdpCapture } from './qa-cdp.js';

runCdpCapture({
  url: 'http://127.0.0.1:3000/evidence',
  filename: 'diag-390.png',
  width: 390,
  height: 844,
  seedDemo: false,
  evalScript: `
    (() => {
      const wide = [];
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.right > 390.5) {
          wide.push({
            tag: el.tagName,
            id: el.id,
            className: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
            width: Math.round(r.width),
            right: Math.round(r.right),
            text: el.innerText ? el.innerText.slice(0, 30) : ''
          });
        }
      });
      return wide.slice(0, 15);
    })()
  `
}).then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
