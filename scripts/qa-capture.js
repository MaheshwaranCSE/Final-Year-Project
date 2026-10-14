import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'docs', 'ui-qa');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const url = process.argv[2] || 'http://127.0.0.1:3000/evidence';
const filename = process.argv[3] || 'capture.png';
const width = process.argv[4] || '1536';
const height = process.argv[5] || '720';

const targetPath = path.join(outDir, filename);
const tempDir = path.join(process.env.TEMP || 'C:\\temp', `chrome-qa-${Date.now()}`);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const args = [
  '--headless=new',
  `--user-data-dir=${tempDir}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--virtual-time-budget=4000',
  `--window-size=${width},${height}`,
  `--screenshot=${targetPath}`,
  url
];

console.log(`Capturing ${url} (${width}x${height}) to ${targetPath}...`);

const chrome = spawn(chromePath, args);

chrome.on('close', (code) => {
  console.log(`Chrome exited with code ${code}`);
  if (fs.existsSync(targetPath)) {
    const stats = fs.statSync(targetPath);
    console.log(`SUCCESS: ${targetPath} generated (${stats.size} bytes)`);
  } else {
    console.error(`FAILED: File ${targetPath} does not exist`);
  }
  // cleanup temp profile
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {
    // ignore
  }
});
