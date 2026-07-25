import { chromium } from 'file:///C:/Users/PICHAU/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs';
import { pathToFileURL } from 'node:url';

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true
});

try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL('D:\\Jogo Bandeiras 2.0\\assets\\icone-super-bandeiras.svg').href);
  await page.screenshot({ path: 'D:\\Jogo Bandeiras 2.0\\assets\\icone-super-bandeiras.png' });
  console.log('OK: SVG renderizado em PNG 1024x1024.');
} finally {
  await browser.close();
}
