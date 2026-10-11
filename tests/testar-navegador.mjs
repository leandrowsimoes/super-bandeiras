import { chromium } from 'file:///C:/Users/PICHAU/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = 'D:\\Jogo Bandeiras 2.0';
const baseUrl = pathToFileURL(path.join(root, 'index.html')).href;
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true
});

function falhar(mensagem) { throw new Error(mensagem); }

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  const limpar = async (extras = {}) => {
    await page.goto(baseUrl);
    await page.evaluate(e => {
      localStorage.clear();
      localStorage.setItem('vb_som', 'nao');
      localStorage.setItem('vb_musica', 'nao');
      for (const [k, v] of Object.entries(e)) localStorage.setItem(k, v);
    }, extras);
  };
  const codigoDaBandeira = async () => (await page.getAttribute('#img-bandeira', 'src')).match(/bandeiras\/([a-z]{2})\.png/)[1];
  const acertar = async () => page.locator(`.btn-resposta[data-codigo="${await codigoDaBandeira()}"]`).click();
  const errar = async () => page.locator(`.btn-resposta:not([data-codigo="${await codigoDaBandeira()}"])`).first().click();
  const proxima = async () => page.locator('#btn-proxima').click();
  const esperarPergunta = n => page.waitForFunction(esperado => document.querySelector('#contador')?.textContent === `Bandeira ${esperado} de 10`, n);

  // --- 1. Os quatro níveis iniciam pelo atalho de URL ---
  await limpar();
  for (const level of ['facil', 'medio', 'dificil', 'impossivel']) {
    await page.goto(`${baseUrl}?nivel=${level}`);
    await page.waitForSelector('#tela-jogo:not([hidden])');
    const answers = await page.locator('.btn-resposta').count();
    const counter = await page.locator('#contador').textContent();
    if (answers !== 4 || counter !== 'Bandeira 1 de 10') falhar(`Nível ${level} não iniciou corretamente.`);
  }

  // --- 2. Partida completa: pontos, combo, curiosidade, estrelas, recorde, carimbos ---
  await limpar();
  await page.goto(`${baseUrl}?nivel=facil`);
  await page.waitForSelector('#tela-jogo:not([hidden])');
  let viuCombo = false;
  for (let q = 1; q <= 10; q += 1) {
    await acertar();
    await page.waitForSelector('#curiosidade:not([hidden])');
    if (!(await page.locator('#curiosidade-texto').textContent()).trim()) falhar('Curiosidade vazia.');
    if (q >= 2) viuCombo = viuCombo || await page.evaluate(() => !document.querySelector('#selo-combo').hidden);
    await proxima();
    if (q < 10) await esperarPergunta(q + 1);
  }
  await page.waitForSelector('#tela-fim:not([hidden])');
  if (!viuCombo) falhar('Selo de combo nunca apareceu durante a sequência de acertos.');
  if (!/pontos/.test(await page.locator('#placar-final').textContent())) falhar('Tela de fim não mostra os pontos.');
  await page.waitForSelector('#estrelas .estrela.acesa:nth-child(3)', { timeout: 5000 });
  await page.waitForSelector('#novo-recorde:not([hidden])', { timeout: 6000 });
  if (!(await page.locator('.mini-carimbo').count())) falhar('Carimbos novos não apareceram na tela de fim.');

  await page.locator('#btn-mudar').click();
  await page.waitForSelector('#tela-niveis:not([hidden])');
  if (!(await page.locator('[data-recorde="facil"] svg').count())) falhar('Selo de recorde por pontos ausente.');

  // --- 3. Passaporte mostra os carimbos conquistados ---
  await page.locator('#tela-niveis [data-voltar-inicio]').click();
  await page.waitForSelector('#tela-inicio:not([hidden])');
  await page.locator('[data-ir="passaporte"]').click();
  await page.waitForSelector('#tela-passaporte:not([hidden])');
  const carimbados = await page.locator('.carimbo-passaporte.obtido').count();
  if (carimbados !== 10) falhar(`Passaporte deveria ter 10 carimbos, tem ${carimbados}.`);
  await page.locator('.carimbo-passaporte.obtido').first().click();
  await page.waitForSelector('#cartao-pais:not([hidden])');
  await page.keyboard.press('Escape');
  await page.waitForSelector('#cartao-pais', { state: 'hidden' });

  // --- 4. Pequeno Explorador: 3 opções, sem bônus, segunda chance ---
  await limpar({ vb_pequeno: 'sim' });
  await page.goto(`${baseUrl}?nivel=facil`);
  await page.waitForSelector('#tela-jogo:not([hidden])');
  if ((await page.locator('.btn-resposta').count()) !== 3) falhar('Pequeno Explorador deveria ter 3 opções.');
  if (!(await page.locator('#barra-bonus').isHidden())) falhar('Barra de bônus deveria sumir no Pequeno Explorador.');
  await errar();
  if (await page.locator('#curiosidade').isVisible()) falhar('Primeiro erro deveria dar segunda chance.');
  await acertar();
  await page.waitForSelector('#curiosidade:not([hidden])');
  if (!/50/.test(await page.locator('#placar').textContent())) falhar('Acerto na segunda chance deveria valer 50 pontos.');

  // --- 5. Modo "Ache a bandeira" + ajudas ---
  await limpar({ vb_modo: 'bandeira' });
  await page.goto(`${baseUrl}?nivel=medio`);
  await page.waitForSelector('#tela-jogo:not([hidden])');
  if ((await page.locator('.btn-resposta img.bandeira-opcao').count()) !== 4) falhar('Modo bandeira deveria mostrar 4 bandeiras.');
  if (!(await page.locator('#nome-alvo').isVisible())) falhar('Modo bandeira deveria mostrar o nome do país.');
  await page.locator('#btn-lupa').click();
  if ((await page.locator('.btn-resposta:not(:disabled)').count()) !== 2) falhar('Lupa deveria deixar só 2 opções.');
  await page.locator('#btn-dica').click();
  if (!/Fica/.test(await page.locator('#dica-continente').textContent())) falhar('Dica deveria mostrar o continente.');

  // --- 6. Mapa: só a primeira fase liberada; passar libera a próxima ---
  await limpar();
  await page.goto(baseUrl);
  await page.locator('[data-ir="mapa"]').click();
  await page.waitForSelector('#tela-mapa:not([hidden])');
  if ((await page.locator('.no-fase:not(:disabled)').count()) !== 1) falhar('Só a fase América-1 deveria estar liberada.');
  await page.locator('[data-fase="america-1"]').click();
  await page.waitForSelector('#tela-jogo:not([hidden])');
  const total = await page.evaluate(() => document.querySelectorAll('#progresso .ponto').length);
  for (let q = 1; q <= total; q += 1) {
    await acertar();
    await proxima();
    if (q < total) await page.waitForFunction(n => document.querySelector('#contador').textContent.startsWith(`Bandeira ${n} `), q + 1);
  }
  await page.waitForSelector('#tela-fim:not([hidden])');
  await page.locator('#btn-mudar').click();
  await page.waitForSelector('#tela-mapa:not([hidden])');
  if (await page.locator('[data-fase="america-2"]').isDisabled()) falhar('Passar a fase 1 deveria liberar a fase 2.');

  // --- 7. Minijogos: memória e relâmpago terminam na tela de resultado ---
  await limpar();
  await page.goto(baseUrl);
  await page.locator('[data-ir="minijogos"]').click();
  await page.locator('#btn-memoria').click();
  await page.waitForSelector('#tela-memoria:not([hidden])');
  const codigos = await page.$$eval('.carta-memoria', cartas => [...new Set(cartas.map(c => c.dataset.codigo))]);
  for (const codigo of codigos) {
    const par = page.locator(`.carta-memoria[data-codigo="${codigo}"]`);
    await par.nth(0).click();
    await par.nth(1).click();
  }
  await page.waitForSelector('#tela-fim:not([hidden])');
  await page.locator('#btn-mudar').click();
  await page.waitForSelector('#tela-minijogos:not([hidden])');
  await page.locator('#btn-relampago').click();
  await page.waitForSelector('#tela-relampago:not([hidden])');
  await page.locator('#btn-sim').click();
  await page.waitForSelector('#tela-fim:not([hidden])', { timeout: 60000 });

  // --- 8. Layout ---
  await page.goto(baseUrl);
  await page.screenshot({ path: path.join(root, 'tests', 'super-bandeiras-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  await page.screenshot({ path: path.join(root, 'tests', 'super-bandeiras-desktop.png'), fullPage: true });
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (horizontalOverflow) falhar('Há rolagem horizontal no desktop.');
  if (errors.length) falhar(`Erros JavaScript: ${errors.join(' | ')}`);
  console.log('OK: níveis, partida, carimbos, passaporte, Pequeno Explorador, modo bandeira, ajudas, mapa, minijogos e layouts verificados.');
} finally {
  await browser.close();
}
