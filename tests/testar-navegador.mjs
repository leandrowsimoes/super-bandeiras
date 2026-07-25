import { chromium } from 'file:///C:/Users/PICHAU/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = 'D:\\Jogo Bandeiras 2.0';
const baseUrl = pathToFileURL(path.join(root, 'index.html')).href;
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true
});

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  for (const level of ['facil', 'medio', 'dificil', 'impossivel']) {
    await page.goto(`${baseUrl}?nivel=${level}`);
    await page.waitForSelector('#tela-jogo:not([hidden])');
    const answers = await page.locator('.btn-resposta').count();
    const counter = await page.locator('#contador').textContent();
    if (answers !== 4 || counter !== 'Bandeira 1 de 10') {
      throw new Error(`Nível ${level} não iniciou corretamente.`);
    }
  }

  await page.goto(`${baseUrl}?nivel=facil`);
  for (let question = 0; question < 10; question += 1) {
    await page.locator('.btn-resposta').first().click();
    if (question < 9) {
      await page.waitForFunction(expected => document.querySelector('#contador')?.textContent === `Bandeira ${expected} de 10`, question + 2);
    }
  }
  await page.waitForSelector('#tela-fim:not([hidden])');
  await page.locator('#btn-de-novo').click();
  await page.waitForSelector('#tela-jogo:not([hidden])');

  // --- Mecânica: pontos, combo e recorde por pontos ---
  await page.goto(baseUrl);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${baseUrl}?nivel=facil`);
  await page.waitForSelector('#tela-jogo:not([hidden])');

  const acertar = async () => {
    const src = await page.getAttribute('#img-bandeira', 'src');
    const cod = src.match(/bandeiras\/([a-z]{2})\.png/)[1];
    await page.locator(`.btn-resposta[data-codigo="${cod}"]`).click();
  };

  // 1º acerto: o placar deve passar de 0.
  await acertar();
  await page.waitForFunction(() => {
    const n = parseInt((document.querySelector('#placar')?.textContent || '').replace(/\D/g, ''), 10);
    return n > 0;
  });

  // Completa a rodada acertando tudo (combo cresce, selo aparece a partir do 2º).
  let viuCombo = false;
  for (let q = 1; q <= 10; q += 1) {
    if (q >= 2) {
      viuCombo = viuCombo || await page.evaluate(() => !document.querySelector('#selo-combo')?.hidden);
    }
    if (q === 1) { /* já acertou acima */ } else { await acertar(); }
    if (q < 10) {
      await page.waitForFunction(n => document.querySelector('#contador')?.textContent === `Bandeira ${n} de 10`, q + 1);
    }
  }
  await page.waitForSelector('#tela-fim:not([hidden])');
  if (!viuCombo) throw new Error('Selo de combo nunca apareceu durante a sequência de acertos.');

  const resumo = await page.locator('#placar-final').textContent();
  if (!/pontos/.test(resumo)) throw new Error('Tela de fim não mostra os pontos.');
  if (!(await page.locator('#novo-recorde:not([hidden])').count())) {
    throw new Error('Novo recorde deveria aparecer na primeira rodada (storage foi limpo).');
  }

  await page.locator('#btn-mudar').click();
  await page.waitForSelector('#tela-inicio:not([hidden])');
  const seloRecorde = await page.locator('[data-recorde="facil"]').textContent();
  if (!/🏆/.test(seloRecorde)) throw new Error('Selo de recorde por pontos ausente na tela inicial.');

  await page.goto(baseUrl);
  await page.screenshot({ path: path.join(root, 'tests', 'super-bandeiras-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  await page.screenshot({ path: path.join(root, 'tests', 'super-bandeiras-desktop.png'), fullPage: true });

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (horizontalOverflow) throw new Error('Há rolagem horizontal no desktop.');
  if (errors.length) throw new Error(`Erros JavaScript: ${errors.join(' | ')}`);
  console.log('OK: quatro níveis, partida completa, reinício e layouts verificados.');
} finally {
  await browser.close();
}


