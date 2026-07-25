# Mecânica de Jogo (pontos, velocidade, combo) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o quiz de bandeiras em algo com "sensação de jogo" — pontuação por acerto com bônus de velocidade e multiplicador de combo, sem timer punitivo e sem alterar a identidade visual.

**Architecture:** Mudança cirúrgica em 3 arquivos existentes (`index.html`, `css/estilo.css`, `js/jogo.js`). O placar da rodada passa a somar pontos; uma barra de bônus (transição CSS de 8 s) mede a rapidez; o tempo é aferido por `performance.now()` (independe da animação); combo é um contador de acertos consecutivos com teto ×5; recorde por nível passa a ser a maior pontuação (`localStorage` chave `vb_pontos_<nivel>`). Estrelas do fim continuam por acertos.

**Tech Stack:** HTML/CSS/JS estático (sem build, sem framework). Testes: validadores PowerShell por *string-match* (`tests/validar-comportamento.ps1`) e teste end-to-end Playwright em Edge headless (`tests/testar-navegador.mjs`).

---

## Nota sobre git

Esta pasta **não é um repositório git** (não existe `.git`). Portanto os passos de "commit" abaixo estão marcados como **opcionais**: só se aplicam se o usuário rodar `git init` antes. Se não houver git, pule os passos de commit e use os checkpoints de teste como ponto de verificação/parada entre tarefas.

## Constantes e fórmula (referência para todas as tarefas)

```js
var DURACAO_BONUS = 8;   // segundos da janela de bônus
var PONTO_BASE   = 100;  // pontos-base por acerto
var BONUS_MAX    = 100;  // bônus máximo por velocidade
var COMBO_MAX    = 5;    // teto do multiplicador de combo
```

```
bonusVelocidade = round(BONUS_MAX * max(0, tempoRestante / DURACAO_BONUS))
multiplicador   = min(comboAtual, COMBO_MAX)          // comboAtual inclui o acerto atual
pontosDaPergunta = round((PONTO_BASE + bonusVelocidade) * multiplicador)
```

Erro (ou não responder): 0 pontos e `combo = 0`. Nunca subtrai pontos.

## Estrutura de arquivos

- `index.html` — adiciona a barra de bônus (após `.quadro-bandeira`) e o selo de combo (agrupado com o placar na `.barra`).
- `css/estilo.css` — estilos de `.barra-bonus`, `.barra-bonus-fill`, `.placar-area`, `.selo-combo`, `.pontos-flutuantes` + keyframe `subir-pontos`.
- `js/jogo.js` — constantes, estado (`pontos`, `combo`, `inicioPergunta`), helpers de pontos/recorde, barra de bônus, selo de combo, pontos flutuantes; e edições em `montarRodada`, `mostrarPergunta`, `responder`, `terminar`, `atualizarRecordesInicio`. Remove `chaveRecorde`/`lerRecorde` (ficam órfãos).
- `tests/validar-comportamento.ps1` — novas asserções de presença.
- `tests/testar-navegador.mjs` — nova seção e2e de pontos/combo/recorde.

---

## Task 1: Escrever os testes primeiro (TDD — vermelho)

Adiciona asserções para a mecânica nova. Elas devem **falhar** agora, porque nada foi implementado.

**Files:**
- Modify: `tests/validar-comportamento.ps1`
- Modify: `tests/testar-navegador.mjs`

- [ ] **Step 1: Adicionar asserções de presença ao validador PowerShell**

Em `tests/validar-comportamento.ps1`, logo após o bloco que valida os IDs do HTML (a linha do `ForEach-Object` que checa `tela-inicio`... `btn-mudar`), adicione a checagem dos novos IDs:

```powershell
@('barra-bonus', 'barra-bonus-fill', 'selo-combo') | ForEach-Object {
    if ($html -notmatch ('id="' + [regex]::Escape($_) + '"')) { throw "ID de mecânica ausente: $_" }
}
```

No bloco do CSS (após as checagens de `prefers-reduced-motion` e `:focus-visible`), adicione:

```powershell
@('.barra-bonus', '.selo-combo', '.pontos-flutuantes', 'subir-pontos') | ForEach-Object {
    if ($css -notmatch [regex]::Escape($_)) { throw "Estilo de mecânica ausente: $_" }
}
```

No bloco do JS, **troque** a linha atual:

```powershell
@('function lerRecorde', "addEventListener('error'", 'Resposta certa', 'Sua escolha') | ForEach-Object {
```

por (o `lerRecorde` antigo será removido; passamos a exigir as funções novas):

```powershell
@('function lerRecordePontos', 'function calcularPontos', 'vb_pontos_', "addEventListener('error'", 'Resposta certa', 'Sua escolha') | ForEach-Object {
```

- [ ] **Step 2: Adicionar a seção e2e de mecânica ao teste Playwright**

Em `tests/testar-navegador.mjs`, **antes** do bloco final de screenshots (a linha `await page.goto(baseUrl);` que precede os `page.screenshot(...)`), insira:

```js
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
```

> Observação de lógica: no laço, `q=1` já foi respondido antes do laço; para `q>=2` acertamos dentro do laço. A checagem de combo lê `#selo-combo` **antes** de acertar aquela pergunta, capturando o estado deixado pelo acerto anterior.

- [ ] **Step 3: Rodar os testes e confirmar que FALHAM**

```bash
pwsh -File "tests/validar-comportamento.ps1"
```
Esperado: FALHA com `ID de mecânica ausente: barra-bonus` (ou similar).

```bash
node "tests/testar-navegador.mjs"
```
Esperado: FALHA (elementos/comportamento ainda não existem). Se o Node/Playwright não estiver disponível nesta máquina, registre isso e use verificação manual no navegador nas tarefas seguintes.

- [ ] **Step 4 (opcional — só com git): Commit**

```bash
git add tests/validar-comportamento.ps1 tests/testar-navegador.mjs
git commit -m "test: cobre mecânica de pontos, combo e recorde"
```

---

## Task 2: Markup da barra de bônus e do selo de combo

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Adicionar a barra de bônus após a bandeira**

Em `index.html`, dentro de `<div class="carta carta-jogo">`, localize o fim de `<div class="quadro-bandeira">…</div>` e insira **logo depois dele** (antes de `<h2 class="pergunta">`):

```html
<div id="barra-bonus" class="barra-bonus" aria-hidden="true"><span id="barra-bonus-fill" class="barra-bonus-fill"></span></div>
```

- [ ] **Step 2: Agrupar placar + selo de combo na barra superior**

Ainda em `index.html`, na `<div class="barra">` da tela de jogo, **substitua**:

```html
<span id="placar" class="placar">⭐ 0</span>
```

por:

```html
<div class="placar-area"><span id="placar" class="placar">⭐ 0</span><span id="selo-combo" class="selo-combo" hidden>🔥 x2</span></div>
```

- [ ] **Step 3: Verificar o validador de presença HTML**

```bash
pwsh -File "tests/validar-comportamento.ps1"
```
Esperado: agora passa das checagens de HTML e falha mais adiante nas de **CSS** (`Estilo de mecânica ausente: .barra-bonus`). Isso confirma que o markup entrou.

- [ ] **Step 4 (opcional — só com git): Commit**

```bash
git add index.html
git commit -m "feat: markup da barra de bônus e do selo de combo"
```

---

## Task 3: Estilos da mecânica

**Files:**
- Modify: `css/estilo.css`

- [ ] **Step 1: Adicionar os estilos ao fim de `css/estilo.css`**

Acrescente ao final do arquivo:

```css
.barra-bonus{height:10px;margin:12px 0 2px;border:2px solid var(--tinta);border-radius:99px;background:#fff;overflow:hidden}
.barra-bonus-fill{display:block;height:100%;width:100%;border-radius:99px;background:linear-gradient(90deg,var(--verde),var(--amarelo))}
.placar-area{display:flex;align-items:center;gap:8px}
.selo-combo{padding:6px 11px;border:2px solid var(--tinta);border-radius:99px;background:var(--vermelho);color:#fff;font-family:Fredoka,sans-serif;font-size:.92rem;white-space:nowrap}
.selo-combo.pulsar{animation:carimbar .3s both}
.pontos-flutuantes{position:absolute;left:50%;top:36%;z-index:4;padding:0 6px;color:var(--verde);font-family:Fredoka,sans-serif;font-size:clamp(1.4rem,5vw,2rem);text-shadow:0 2px 0 #fff,0 3px 0 var(--tinta);pointer-events:none;animation:subir-pontos 1.1s ease-out forwards}
@keyframes subir-pontos{0%{opacity:0;transform:translate(-50%,10px) scale(.8)}20%{opacity:1}100%{opacity:0;transform:translate(-50%,-62px) scale(1)}}
```

> `.selo-combo.pulsar` e `subir-pontos` são animações; o bloco `@media(prefers-reduced-motion:reduce)` existente já as neutraliza globalmente. A barra de bônus usa transição inline (Task 4); sob movimento reduzido ela salta para vazia — aceitável, pois a pontuação é aferida por tempo real, não pela animação.

- [ ] **Step 2: Verificar o validador de presença CSS**

```bash
pwsh -File "tests/validar-comportamento.ps1"
```
Esperado: passa das checagens de CSS e falha nas de **JS** (`Comportamento obrigatório ausente: function lerRecordePontos`).

- [ ] **Step 3 (opcional — só com git): Commit**

```bash
git add css/estilo.css
git commit -m "feat: estilos da barra de bônus, selo de combo e pontos flutuantes"
```

---

## Task 4: Lógica da mecânica em `js/jogo.js`

Todas as edições são dentro da IIFE existente. Mantêm o estilo (var, funções pequenas, comentários do "porquê").

**Files:**
- Modify: `js/jogo.js`

- [ ] **Step 1: Adicionar constantes**

Logo após `var TOTAL_PERGUNTAS = 10;`, adicione:

```js
  var DURACAO_BONUS = 8;   // segundos da janela de bônus por pergunta
  var PONTO_BASE    = 100; // pontos-base por acerto
  var BONUS_MAX     = 100; // bônus máximo por responder rápido
  var COMBO_MAX     = 5;   // teto do multiplicador de acertos seguidos
```

- [ ] **Step 2: Adicionar campos de estado**

No objeto `var jogo = { … }`, acrescente três campos (após `respondido: false`, ajustando a vírgula):

```js
    respondido: false,
    pontos: 0,
    combo: 0,
    inicioPergunta: 0
```

- [ ] **Step 3: Referenciar os novos elementos**

Junto aos outros `var … = document.getElementById(...)` (perto do topo, região "Elementos"), adicione:

```js
  var barraBonusFill = document.getElementById('barra-bonus-fill');
  var seloComboEl    = document.getElementById('selo-combo');
  var quadroBandeira = document.querySelector('.quadro-bandeira');
```

- [ ] **Step 4: Remover funções órfãs e adicionar helpers de pontos/recorde**

**Remova** as funções `chaveRecorde` e `lerRecorde` (elas só eram usadas por `atualizarRecordesInicio` e `terminar`, que serão reescritas). No lugar delas, na seção "Utilidades", adicione:

```js
  function formatarPontos(n) {
    return n.toLocaleString('pt-BR');
  }

  function chaveRecordePontos(nivel) {
    return 'vb_pontos_' + nivel;
  }

  function lerRecordePontos(nivel) {
    var valor = parseInt(localStorage.getItem(chaveRecordePontos(nivel)), 10);
    return !isNaN(valor) && valor >= 0 ? valor : null;
  }

  function calcularPontos(tempoRestante, combo) {
    var fracao = Math.max(0, tempoRestante / DURACAO_BONUS);
    var bonus = Math.round(BONUS_MAX * fracao);
    var mult = Math.min(combo, COMBO_MAX);
    return Math.round((PONTO_BASE + bonus) * mult);
  }
```

- [ ] **Step 5: Adicionar barra de bônus, selo de combo e pontos flutuantes**

Adicione estas funções (perto das outras de interface, ex.: após `desenharProgresso`):

```js
  function iniciarBarraBonus() {
    jogo.inicioPergunta = performance.now();
    // Reinicia a barra cheia e a esvazia linearmente na janela de bônus.
    barraBonusFill.style.transition = 'none';
    barraBonusFill.style.width = '100%';
    void barraBonusFill.offsetWidth; // força reflow para a largura cheia valer antes de animar
    barraBonusFill.style.transition = 'width ' + DURACAO_BONUS + 's linear';
    barraBonusFill.style.width = '0%';
  }

  function congelarBarraBonus(tempoRestante) {
    var pct = Math.max(0, tempoRestante / DURACAO_BONUS) * 100;
    barraBonusFill.style.transition = 'none';
    barraBonusFill.style.width = pct + '%';
  }

  function atualizarCombo() {
    if (jogo.combo >= 2) {
      seloComboEl.textContent = '🔥 x' + Math.min(jogo.combo, COMBO_MAX);
      seloComboEl.hidden = false;
      seloComboEl.classList.remove('pulsar');
      void seloComboEl.offsetWidth; // reinicia a animação de pulso
      seloComboEl.classList.add('pulsar');
    } else {
      seloComboEl.hidden = true;
    }
  }

  function mostrarPontosFlutuantes(valor) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var bolha = document.createElement('div');
    bolha.className = 'pontos-flutuantes';
    bolha.textContent = '+' + formatarPontos(valor);
    quadroBandeira.appendChild(bolha);
    setTimeout(function () { bolha.remove(); }, 1200);
  }
```

- [ ] **Step 6: Zerar pontos/combo ao montar a rodada**

Em `montarRodada`, junto de `jogo.acertos = 0;`, adicione:

```js
    jogo.pontos = 0;
    jogo.combo = 0;
```

- [ ] **Step 7: Iniciar a barra e mostrar pontos ao exibir a pergunta**

Em `mostrarPergunta`, **troque**:

```js
    placarEl.textContent = '⭐ ' + jogo.acertos;
    desenharProgresso();
```

por:

```js
    placarEl.textContent = '⭐ ' + formatarPontos(jogo.pontos);
    desenharProgresso();
    atualizarCombo();
    iniciarBarraBonus();
```

- [ ] **Step 8: Pontuar dentro de `responder`**

No início de `responder`, logo após `calarFala();`, congele a barra e aponte o tempo restante:

```js
    var tempoRestante = DURACAO_BONUS - (performance.now() - jogo.inicioPergunta) / 1000;
    congelarBarraBonus(tempoRestante);
```

No ramo do acerto (`if (acertou) {`), **substitua**:

```js
    if (acertou) {
      jogo.acertos++;
      carimbar('ACERTOU!', 'certo');
      avisoEl.textContent = elogio();
      tocar('acerto');
    } else {
```

por:

```js
    if (acertou) {
      jogo.acertos++;
      jogo.combo++;
      var ganho = calcularPontos(tempoRestante, jogo.combo);
      jogo.pontos += ganho;
      atualizarCombo();
      mostrarPontosFlutuantes(ganho);
      carimbar('ACERTOU!', 'certo');
      avisoEl.textContent = elogio();
      tocar('acerto');
    } else {
```

No ramo do erro, logo após `botaoClicado.classList.add('errada');`, adicione:

```js
      jogo.combo = 0;
      atualizarCombo();
```

Depois, **troque** a linha que reescrevia o placar por acertos:

```js
    placarEl.textContent = '⭐ ' + jogo.acertos;
```

por:

```js
    placarEl.textContent = '⭐ ' + formatarPontos(jogo.pontos);
```

- [ ] **Step 9: Recorde por pontos e resumo em `terminar`**

Em `terminar`, **substitua** o bloco:

```js
    placarFinalEl.textContent = 'Você acertou ' + acertos + ' de ' + total + ' bandeiras no nível ' + NIVEIS[jogo.nivel].nome + '.';

    var recordeAntigo = lerRecorde(jogo.nivel);
    var bateuRecorde = recordeAntigo === null ? acertos > 0 : acertos > recordeAntigo;
    if (bateuRecorde) {
      localStorage.setItem(chaveRecorde(jogo.nivel), String(acertos));
    }
    novoRecordeEl.hidden = !bateuRecorde;
```

por:

```js
    placarFinalEl.textContent = 'Você fez ' + formatarPontos(jogo.pontos) + ' pontos e acertou ' + acertos + ' de ' + total + ' bandeiras no nível ' + NIVEIS[jogo.nivel].nome + '.';

    var recordeAntigo = lerRecordePontos(jogo.nivel);
    var bateuRecorde = recordeAntigo === null ? jogo.pontos > 0 : jogo.pontos > recordeAntigo;
    if (bateuRecorde) {
      localStorage.setItem(chaveRecordePontos(jogo.nivel), String(jogo.pontos));
    }
    novoRecordeEl.hidden = !bateuRecorde;
```

(As estrelas por acertos, medalhas e a fanfarra permanecem inalteradas.)

- [ ] **Step 10: Tela inicial mostra o recorde de pontos**

Em `atualizarRecordesInicio`, **substitua**:

```js
      var recorde = lerRecorde(nivel);
      botoes[i].textContent = recorde === null ? '' : '🏅 ' + recorde + '/' + TOTAL_PERGUNTAS;
```

por:

```js
      var recorde = lerRecordePontos(nivel);
      botoes[i].textContent = recorde === null ? '' : '🏆 ' + formatarPontos(recorde);
```

- [ ] **Step 11: Verificar o validador de comportamento (JS)**

```bash
pwsh -File "tests/validar-comportamento.ps1"
```
Esperado: `OK: interface e comportamentos obrigatórios validados.`

- [ ] **Step 12 (opcional — só com git): Commit**

```bash
git add js/jogo.js
git commit -m "feat: pontuação com bônus de velocidade, combo e recorde por pontos"
```

---

## Task 5: Verificação end-to-end e manual

**Files:** nenhum (apenas execução).

- [ ] **Step 1: Rodar o teste Playwright completo**

```bash
node "tests/testar-navegador.mjs"
```
Esperado: termina sem erro (a saída atual imprime uma linha de OK ao final). Verifica os 4 níveis, a seção de pontos/combo/recorde e regenera os screenshots.

Se Node/Playwright não estiver disponível, pule para a verificação manual.

- [ ] **Step 2: Verificação manual no navegador**

Abra `index.html` e confira os critérios de sucesso do spec:
1. Responder **na hora** → ~200 pts no 1º acerto; esperar a barra esvaziar e responder → ~100 pts.
2. Dois acertos seguidos mostram `🔥 x2`; três mostram `🔥 x3`; um erro faz o selo sumir.
3. Deixar o tempo acabar **não** dá game over nem tira pontos.
4. Tela de fim: "Você fez X pontos e acertou N de 10…"; estrelas seguem os acertos.
5. Bater a maior pontuação mostra `🎉 Novo recorde!` e a tela inicial passa a exibir `🏆 <pontos>`.
6. Com "reduzir movimento" ativo no SO, o jogo pontua sem pop-ups animados.

- [ ] **Step 3: Rodar todos os validadores restantes**

```bash
pwsh -File "tests/validar-projeto.ps1"
pwsh -File "tests/validar-comportamento.ps1"
```
Esperado: ambos imprimem `OK`.

- [ ] **Step 4 (opcional — só com git): Commit final**

```bash
git add -A
git commit -m "chore: verifica mecânica de jogo end-to-end"
```

---

## Cobertura do spec (auto-revisão)

- Pontuação base+velocidade+combo → Task 4 (Steps 1, 4, 8) + constantes/fórmula.
- Timer como janela de bônus (sem game over) → Task 2 (barra), Task 3 (estilo), Task 4 (Steps 5, 7, 8: barra dispara em `mostrarPergunta`, congela em `responder`; nenhum caminho força erro por tempo).
- Barra de bônus / selo de combo / pontos flutuantes → Task 2 + Task 3 + Task 4 (Step 5).
- Placar em pontos → Task 4 (Steps 7, 8).
- Tela de fim (pontos + acertos, estrelas por acerto) → Task 4 (Step 9).
- Recorde por pontos + tela inicial `🏆` → Task 4 (Steps 9, 10).
- Chave antiga `vb_recorde_<nivel>` não é lida/escrita → Task 4 (Step 4 remove `lerRecorde`/`chaveRecorde`).
- `prefers-reduced-motion` → Task 3 (nota) + Task 4 (Step 5, guarda em `mostrarPontosFlutuantes`).
- Acessibilidade preservada (teclas 1–4, voz, aria) → nenhum trecho relevante é tocado.
