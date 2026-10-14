import { runCdpCapture } from './qa-cdp.js';

runCdpCapture({
  url: 'http://127.0.0.1:3000/evidence',
  filename: 'measure.png',
  width: 1536,
  height: 720,
  seedDemo: true,
  evalScript: `
    (() => {
      function serializeRect(r) {
        if (!r) return null;
        return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
      }

      const sidebar = document.querySelector('aside');
      const container = document.querySelector('.max-w-7xl');
      const tableCard = document.querySelector('.overflow-hidden.shadow-sm');
      const table = document.querySelector('table');
      const thActions = document.querySelectorAll('th')[6];
      const thEvidence = document.querySelectorAll('th')[0];
      const kpi = document.querySelector('.h-\\\\[120px\\\\]');
      const searchInput = document.querySelector('input[type="text"]');

      return {
        windowWidth: window.innerWidth,
        sidebar: serializeRect(sidebar?.getBoundingClientRect()),
        container: serializeRect(container?.getBoundingClientRect()),
        tableCard: serializeRect(tableCard?.getBoundingClientRect()),
        table: serializeRect(table?.getBoundingClientRect()),
        thActions: serializeRect(thActions?.getBoundingClientRect()),
        kpiPadding: kpi ? getComputedStyle(kpi).padding : null,
        kpiHeight: kpi ? getComputedStyle(kpi).height : null,
        searchInputPaddingLeft: searchInput ? getComputedStyle(searchInput).paddingLeft : null,
        fontFamily: getComputedStyle(document.body).fontFamily
      };
    })()
  `
}).then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
