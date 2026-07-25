# Super Bandeiras! Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir em `D:\Jogo Bandeiras 2.0` uma versão infantil, moderna, responsiva e totalmente offline do jogo original, preservando regras, conteúdo e recursos existentes.

**Architecture:** Aplicação estática sem build e sem dependências, formada por um HTML com três telas, CSS responsivo e três scripts globais focados em dados, música e regras. Os ativos comprovados do original serão copiados, enquanto HTML/CSS serão reformulados e `jogo.js` receberá somente os ajustes exigidos por robustez, acessibilidade e feedback.

**Tech Stack:** HTML5, CSS3, JavaScript ES5 compatível com execução local, Web Audio API, Web Speech API, PowerShell para validação estrutural.

---

## Estrutura de arquivos

- `index.html`: marcação semântica das telas inicial, partida e resultado.
- `css/estilo.css`: tokens, cenário, componentes, responsividade, estados e redução de movimento.
- `js/paises.js`: catálogo de 163 países, copiado sem mudança funcional.
- `js/musica.js`: trilha offline, copiada sem mudança funcional.
- `js/jogo.js`: sorteio, respostas, pontuação, armazenamento, áudio e transições.
- `bandeiras/*.png`: imagens locais copiadas do original.
- `fontes/*.woff2`: Fredoka e Nunito copiadas do original.
- `tests/validar-projeto.ps1`: validação estrutural e de integridade dos ativos.
- `LEIA-ME.txt`: instruções e recursos da versão 2.0.

### Task 1: Criar a base independente e o teste de integridade

**Files:**
- Create: `bandeiras/*.png`
- Create: `fontes/fredoka.woff2`
- Create: `fontes/nunito.woff2`
- Create: `js/paises.js`
- Create: `js/musica.js`
- Create: `tests/validar-projeto.ps1`

- [ ] **Step 1: Escrever a validação estrutural antes de copiar os ativos**

Criar `tests/validar-projeto.ps1` com verificações que falhem quando arquivos obrigatórios estiverem ausentes, contem exatamente 163 PNGs e confirmem que cada código de `paises.js` possui uma imagem:

```powershell
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$required = @('index.html', 'css\estilo.css', 'js\paises.js', 'js\musica.js', 'js\jogo.js', 'fontes\fredoka.woff2', 'fontes\nunito.woff2')
$missing = $required | Where-Object { -not (Test-Path -LiteralPath (Join-Path $root $_)) }
if ($missing) { throw "Arquivos obrigatórios ausentes: $($missing -join ', ')" }

$flags = Get-ChildItem -LiteralPath (Join-Path $root 'bandeiras') -Filter '*.png'
if ($flags.Count -ne 163) { throw "Esperadas 163 bandeiras; encontradas $($flags.Count)." }

$countriesSource = Get-Content -Raw -LiteralPath (Join-Path $root 'js\paises.js')
$codes = [regex]::Matches($countriesSource, 'codigo:\s*"([a-z]{2})"') | ForEach-Object { $_.Groups[1].Value }
if ($codes.Count -ne 163) { throw "Esperados 163 países; encontrados $($codes.Count)." }
$missingFlags = $codes | Where-Object { -not (Test-Path -LiteralPath (Join-Path $root "bandeiras\$_.png")) }
if ($missingFlags) { throw "Bandeiras ausentes: $($missingFlags -join ', ')" }
Write-Output 'OK: estrutura e 163 bandeiras validadas.'
```

- [ ] **Step 2: Executar a validação e confirmar a falha inicial**

Run: `pwsh -NoProfile -File "D:\Jogo Bandeiras 2.0\tests\validar-projeto.ps1"`

Expected: FAIL listando `index.html`, `css\estilo.css`, `js\jogo.js` e outros arquivos ainda ausentes.

- [ ] **Step 3: Copiar somente os ativos e scripts estáveis do original**

Copiar `bandeiras`, `fontes`, `js/paises.js` e `js/musica.js` de `D:\Jogo Bandeiras`, preservando nomes e bytes. Não copiar o backup ZIP.

- [ ] **Step 4: Comparar a origem e o destino**

Run: `pwsh -NoProfile -Command "(Get-ChildItem 'D:\Jogo Bandeiras 2.0\bandeiras' -Filter *.png).Count; (Get-FileHash 'D:\Jogo Bandeiras\js\paises.js').Hash -eq (Get-FileHash 'D:\Jogo Bandeiras 2.0\js\paises.js').Hash"`

Expected: primeira linha `163`; segunda linha `True`.

### Task 2: Construir a marcação das três telas

**Files:**
- Create: `index.html`

- [ ] **Step 1: Criar a estrutura semântica**

O arquivo deve conter:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Super Bandeiras!</title>
  <link rel="stylesheet" href="css/estilo.css">
  <link rel="icon" href="bandeiras/br.png">
</head>
<body>
  <div class="cenario" aria-hidden="true"><span class="nuvem nuvem-a"></span><span class="nuvem nuvem-b"></span><span class="ilha"></span></div>
  <div class="controles-topo">
    <button id="btn-musica" class="btn-icone" type="button" aria-label="Ligar ou desligar a música">🎵</button>
    <button id="btn-som" class="btn-icone" type="button" aria-label="Ligar ou desligar os efeitos de som">🔊</button>
  </div>
  <main class="palco">
    <section id="tela-inicio" class="tela tela-inicio">
      <div class="mascote" aria-hidden="true"><div class="globo"><span class="rosto">•‿•</span></div></div>
      <p class="sobretitulo">Uma aventura pelo mundo</p><h1>Super<br><span>Bandeiras!</span></h1>
      <p class="chamada">Descubra o país de cada bandeira e torne-se um superexplorador!</p>
      <div class="niveis" aria-label="Escolha a dificuldade">
        <button class="btn-nivel nivel-facil" data-nivel="facil"><span class="nivel-emoji">🌱</span><span class="nivel-textos"><strong>Fácil</strong><small>Países bem famosos</small></span><span class="nivel-recorde" data-recorde="facil"></span></button>
        <button class="btn-nivel nivel-medio" data-nivel="medio"><span class="nivel-emoji">🌍</span><span class="nivel-textos"><strong>Médio</strong><small>Para viajantes espertos</small></span><span class="nivel-recorde" data-recorde="medio"></span></button>
        <button class="btn-nivel nivel-dificil" data-nivel="dificil"><span class="nivel-emoji">🌋</span><span class="nivel-textos"><strong>Difícil</strong><small>Exploradores corajosos</small></span><span class="nivel-recorde" data-recorde="dificil"></span></button>
        <button class="btn-nivel nivel-impossivel" data-nivel="impossivel"><span class="nivel-emoji">👽</span><span class="nivel-textos"><strong>Impossível</strong><small>Só para supergênios</small></span><span class="nivel-recorde" data-recorde="impossivel"></span></button>
      </div>
    </section>
    <section id="tela-jogo" class="tela" hidden>
      <div class="barra"><button id="btn-inicio" class="btn-icone" aria-label="Voltar ao início">🏠</button><span id="selo-nivel"></span><span id="placar">⭐ 0</span></div>
      <div id="progresso" class="progresso" aria-hidden="true"></div><p id="contador" class="contador"></p>
      <div class="carta"><div class="quadro-bandeira"><img id="img-bandeira" alt="Bandeira misteriosa"><div id="carimbo" hidden></div></div><h2>De qual país é esta bandeira?</h2><p id="aviso" aria-live="polite">&nbsp;</p><div id="respostas" class="respostas"></div></div>
    </section>
    <section id="tela-fim" class="tela" hidden>
      <div class="carta carta-fim"><div id="medalha" aria-hidden="true">🏆</div><h2 id="titulo-fim"></h2><div id="estrelas" class="estrelas" aria-hidden="true"><span>★</span><span>★</span><span>★</span></div><p id="placar-final"></p><p id="novo-recorde" hidden>🎉 Novo recorde!</p><div class="acoes"><button id="btn-de-novo">Jogar de novo</button><button id="btn-mudar">Mudar nível</button></div></div>
    </section>
  </main>
  <script src="js/paises.js"></script><script src="js/musica.js"></script><script src="js/jogo.js"></script>
</body>
</html>
```

- [ ] **Step 2: Validar os IDs consumidos pelo jogo**

Run: `pwsh -NoProfile -Command "$html=Get-Content -Raw 'D:\Jogo Bandeiras 2.0\index.html'; @('tela-inicio','tela-jogo','tela-fim','img-bandeira','respostas','aviso','btn-de-novo','btn-mudar') | % { if($html -notmatch ('id=\"'+[regex]::Escape($_)+'\"')){throw \"ID ausente: $_\"} }; 'OK'"`

Expected: `OK`.

### Task 3: Implementar o sistema visual cartoon responsivo

**Files:**
- Create: `css/estilo.css`

- [ ] **Step 1: Definir tokens e bases acessíveis**

Usar variáveis concretas `--ceu:#bdefff`, `--tinta:#173b63`, `--amarelo:#ffd84d`, `--azul:#4d8df7`, `--verde:#4bd287`, `--vermelho:#ff6374`, `--papel:#fffef8`, contorno `3px solid var(--tinta)` e sombra curta `0 6px 0 var(--tinta)`. Incluir `[hidden]{display:none!important}`, `box-sizing:border-box`, `:focus-visible` contrastante e fontes locais.

- [ ] **Step 2: Estilizar cenário, mascote e seleção de níveis**

Construir o céu e as nuvens apenas com CSS. Usar grid de uma coluna em celular e duas colunas acima de `700px`. Cada nível terá cor própria, área mínima de toque de `64px`, contorno e movimento de pressionar por `transform:translateY(4px)` com redução equivalente da sombra.

- [ ] **Step 3: Estilizar partida e resultado**

Limitar o palco a `760px`; manter a bandeira com `object-fit:contain`; criar respostas com selo numérico; implementar `.correta` e `.errada` com cor, ícone textual e contorno; criar carimbo, estrelas e confetes leves sem bloquear interação.

- [ ] **Step 4: Adicionar responsividade e redução de movimento**

Incluir media queries para `max-width:480px`, `min-width:700px`, alturas baixas e:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
}
```

- [ ] **Step 5: Inspecionar 390×844 e 1440×900**

Expected: sem rolagem horizontal; controles sem sobreposição; respostas e ações inteiramente visíveis.

### Task 4: Adaptar as regras e o feedback com mudanças cirúrgicas

**Files:**
- Create: `js/jogo.js`

- [ ] **Step 1: Copiar a lógica original como linha de base**

Copiar `D:\Jogo Bandeiras\js\jogo.js` e preservar `NIVEIS`, sorteio, áudio, fala, atalhos e avaliação final.

- [ ] **Step 2: Endurecer a leitura de recordes**

Substituir a conversão direta por uma função limitada a 0–10:

```javascript
function lerRecorde(nivel) {
  var valor = parseInt(localStorage.getItem('vb_recorde_' + nivel), 10);
  return Number.isFinite(valor) && valor >= 0 && valor <= 10 ? valor : 0;
}
```

Usar `lerRecorde` tanto na tela inicial quanto no resultado.

- [ ] **Step 3: Tratar falha de imagem sem travar a partida**

Adicionar um único listener ao elemento de imagem:

```javascript
imgBandeira.addEventListener('error', function () {
  aviso.textContent = 'Não foi possível mostrar esta bandeira. Você pode continuar escolhendo uma resposta.';
  imgBandeira.alt = 'Bandeira indisponível';
});
```

Ao renderizar uma nova questão, restaurar o texto alternativo com o número da pergunta antes de atribuir `src`.

- [ ] **Step 4: Tornar o feedback inequívoco**

Manter a trava `jogo.respondido` antes de qualquer mutação. Nas respostas, inserir selo numérico e texto em spans separados. No feedback, adicionar `✓ Resposta certa` à correta e `✕ Sua escolha` à errada por texto visível, além das classes existentes.

- [ ] **Step 5: Preservar recursos existentes**

Confirmar que `btn-musica`, `btn-som`, leitura em hover/foco, teclas 1–4, URL direta e botões finais continuam ligados aos mesmos fluxos.

### Task 5: Atualizar a documentação e completar a validação

**Files:**
- Create: `LEIA-ME.txt`
- Modify: `tests/validar-projeto.ps1`

- [ ] **Step 1: Escrever instruções da versão 2.0**

Documentar abertura por `index.html`, quatro níveis, 10 perguntas, funcionamento offline, música, som, fala, teclado, URL direta e estrutura das pastas. Usar o nome **Super Bandeiras!** em todo o texto.

- [ ] **Step 2: Acrescentar referências locais à validação**

Adicionar ao script:

```powershell
$html = Get-Content -Raw -LiteralPath (Join-Path $root 'index.html')
@('css/estilo.css','js/paises.js','js/musica.js','js/jogo.js') | ForEach-Object {
  if ($html -notmatch [regex]::Escape($_)) { throw "Referência ausente no HTML: $_" }
}
if ($html -notmatch '<title>Super Bandeiras!</title>') { throw 'Título do jogo incorreto.' }
```

- [ ] **Step 3: Executar a validação completa**

Run: `pwsh -NoProfile -File "D:\Jogo Bandeiras 2.0\tests\validar-projeto.ps1"`

Expected: `OK: estrutura e 163 bandeiras validadas.`

### Task 6: Verificação funcional e visual final

**Files:**
- Verify: `index.html`
- Verify: `css/estilo.css`
- Verify: `js/jogo.js`

- [ ] **Step 1: Testar carregamento sem internet**

Abrir `index.html` diretamente e confirmar que fontes, cenário, bandeiras e scripts carregam sem requisições HTTP externas.

- [ ] **Step 2: Testar os quatro atalhos de nível**

Abrir `index.html?nivel=facil`, `medio`, `dificil` e `impossivel`. Expected: cada URL inicia na pergunta 1/10 com selo correto e quatro alternativas.

- [ ] **Step 3: Completar uma partida**

Responder dez perguntas, incluindo pelo menos uma por teclado. Expected: somente a primeira resposta conta, feedback correto aparece, progresso avança e a tela final mostra pontuação coerente.

- [ ] **Step 4: Testar persistência e reinício**

Recarregar a página. Expected: recorde e preferências de áudio persistem. Usar “Jogar de novo” e “Mudar nível”; ambos devem navegar sem recarregar a página.

- [ ] **Step 5: Testar acessibilidade e layouts**

Navegar por Tab, confirmar foco visível e anúncio do feedback; simular `prefers-reduced-motion`; inspecionar 390×844 e 1440×900. Expected: nenhum conteúdo cortado, nenhuma rolagem horizontal e animações efetivamente reduzidas.

- [ ] **Step 6: Confirmar isolamento do original**

Run: `pwsh -NoProfile -Command "Get-ChildItem 'D:\Jogo Bandeiras' -Recurse -File | Get-FileHash | Sort-Object Path | ConvertTo-Json -Compress"`

Comparar com o inventário coletado antes da implementação. Expected: nenhum hash do projeto original mudou.

