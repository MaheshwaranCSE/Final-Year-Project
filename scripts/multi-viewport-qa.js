import { runCdpCapture } from './qa-cdp.js';

const viewports = [
  { name: '1536x720', width: 1536, height: 720 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '390x844', width: 390, height: 844 },
];

const evalMetrics = `
  (() => {
    function serializeRect(r) {
      if (!r) return null;
      return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
    }

    const docWidth = document.documentElement.scrollWidth;
    const winWidth = window.innerWidth;
    const sidebar = document.querySelector('aside');
    const container = document.querySelector('.max-w-7xl');
    const tableCard = document.querySelector('.overflow-hidden.shadow-sm');
    const table = document.querySelector('table');
    const kpi = document.querySelector('.h-\\\\[120px\\\\]') || document.querySelector('[class*="h-[120px]"]');

    return {
      windowWidth: winWidth,
      documentScrollWidth: docWidth,
      hasWindowHorizontalScroll: docWidth > winWidth,
      sidebar: serializeRect(sidebar?.getBoundingClientRect()),
      container: serializeRect(container?.getBoundingClientRect()),
      tableCard: serializeRect(tableCard?.getBoundingClientRect()),
      table: serializeRect(table?.getBoundingClientRect()),
      kpiPadding: kpi ? getComputedStyle(kpi).padding : null,
      kpiHeight: kpi ? getComputedStyle(kpi).height : null,
      fontFamily: getComputedStyle(document.body).fontFamily
    };
  })()
`;

async function runAll() {
  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`Running QA for viewport: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    console.log(`--> /dashboard at ${vp.name}...`);
    await runCdpCapture({
      url: 'http://127.0.0.1:3000/dashboard',
      filename: `dashboard-${vp.name}.png`,
      width: vp.width,
      height: vp.height,
      seedDemo: true,
      evalScript: evalMetrics,
    });

    console.log(`--> /evidence at ${vp.name}...`);
    await runCdpCapture({
      url: 'http://127.0.0.1:3000/evidence',
      filename: `evidence-${vp.name}.png`,
      width: vp.width,
      height: vp.height,
      seedDemo: false,
      evalScript: evalMetrics,
    });
  }
}

runAll().then(() => {
  console.log('\nAll viewport captures and evaluations completed successfully!');
  process.exit(0);
}).catch(err => {
  console.error('QA script error:', err);
  process.exit(1);
});
