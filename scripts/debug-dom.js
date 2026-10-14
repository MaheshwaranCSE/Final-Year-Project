import { runCdpCapture } from './qa-cdp.js';
import fs from 'fs';

runCdpCapture({
  url: 'http://127.0.0.1:3000/evidence',
  filename: 'debug-media.png',
  width: 1536,
  height: 720,
  seedDemo: true,
  evalScript: `
    (() => {
      const aside = document.querySelector('aside');
      const mb = aside ? aside.nextElementSibling : null;
      return {
        asideWidth: aside ? getComputedStyle(aside).width : null,
        mainPaddingLeft: mb ? getComputedStyle(mb).paddingLeft : null,
        asideClasses: aside ? aside.className : null,
        mainClasses: mb ? mb.className : null
      };
    })()
  `
}).then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
