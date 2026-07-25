/* ============================================================
   Volta ao Mundo — O Jogo das Bandeiras
   Lógica do quiz: sorteio aleatório, pontuação, sons e recordes.
   ============================================================ */

(function () {
  'use strict';

  var TOTAL_PERGUNTAS = 10;
  var DURACAO_BONUS = 8;   // segundos da janela de bônus por pergunta
  var PONTO_BASE    = 100; // pontos-base por acerto
  var BONUS_MAX     = 100; // bônus máximo por responder rápido
  var COMBO_MAX     = 5;   // teto do multiplicador de acertos seguidos

  var NIVEIS = {
    facil:      { nome: 'Fácil',      emoji: '🌱' },
    medio:      { nome: 'Médio',      emoji: '🌍' },
    dificil:    { nome: 'Difícil',    emoji: '🌋' },
    impossivel: { nome: 'Impossível', emoji: '👽' }
  };

  // ---------- Elementos ----------
  var telaInicio  = document.getElementById('tela-inicio');
  var telaJogo    = document.getElementById('tela-jogo');
  var telaFim     = document.getElementById('tela-fim');
  var imgBandeira = document.getElementById('img-bandeira');
  var carimbo     = document.getElementById('carimbo');
  var respostasEl = document.getElementById('respostas');
  var progressoEl = document.getElementById('progresso');
  var contadorEl  = document.getElementById('contador');
  var placarEl    = document.getElementById('placar');
  var seloNivelEl = document.getElementById('selo-nivel');
  var avisoEl     = document.getElementById('aviso');
  var medalhaEl   = document.getElementById('medalha');
  var tituloFimEl = document.getElementById('titulo-fim');
  var estrelasEl  = document.getElementById('estrelas').children;
  var placarFinalEl = document.getElementById('placar-final');
  var novoRecordeEl = document.getElementById('novo-recorde');
  var btnSom      = document.getElementById('btn-som');
  var barraBonusFill = document.getElementById('barra-bonus-fill');
  var seloComboEl    = document.getElementById('selo-combo');
  var quadroBandeira = document.querySelector('.quadro-bandeira');

  // ---------- Estado ----------
  var jogo = {
    nivel: 'facil',
    perguntas: [],
    indice: 0,
    acertos: 0,
    resultados: [],   // true/false por pergunta, para pintar os pontinhos
    respondido: false,
    pontos: 0,
    combo: 0,
    inicioPergunta: 0
  };

  var somLigado = localStorage.getItem('vb_som') !== 'nao';

  // ---------- Utilidades ----------
  function embaralhar(lista) {
    var copia = lista.slice();
    for (var i = copia.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copia[i];
      copia[i] = copia[j];
      copia[j] = tmp;
    }
    return copia;
  }

  function porNivel(nivel) {
    return PAISES.filter(function (p) { return p.nivel === nivel; });
  }

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

  // ---------- Sons (Web Audio, sem arquivos) ----------
  var contextoAudio = null;

  function nota(freq, inicio, duracao, tipo, volume) {
    var osc = contextoAudio.createOscillator();
    var ganho = contextoAudio.createGain();
    osc.type = tipo || 'triangle';
    osc.frequency.value = freq;
    var t = contextoAudio.currentTime + inicio;
    ganho.gain.setValueAtTime(0.0001, t);
    ganho.gain.exponentialRampToValueAtTime(volume || 0.18, t + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.0001, t + duracao);
    osc.connect(ganho);
    ganho.connect(contextoAudio.destination);
    osc.start(t);
    osc.stop(t + duracao + 0.05);
  }

  function tocar(nome) {
    if (!somLigado) return;
    try {
      if (!contextoAudio) {
        contextoAudio = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (contextoAudio.state === 'suspended') contextoAudio.resume();

      if (nome === 'acerto') {
        nota(523.25, 0,    0.15, 'triangle');
        nota(659.25, 0.08, 0.15, 'triangle');
        nota(783.99, 0.16, 0.22, 'triangle');
      } else if (nome === 'erro') {
        nota(196.00, 0,    0.20, 'sawtooth', 0.10);
        nota(146.83, 0.15, 0.30, 'sawtooth', 0.10);
      } else if (nome === 'clique') {
        nota(880, 0, 0.06, 'square', 0.06);
      } else if (nome === 'fanfarra') {
        nota(523.25, 0,    0.18, 'triangle');
        nota(659.25, 0.14, 0.18, 'triangle');
        nota(783.99, 0.28, 0.18, 'triangle');
        nota(1046.5, 0.42, 0.45, 'triangle', 0.22);
      }
    } catch (e) {
      // Sem áudio disponível: o jogo continua em silêncio.
    }
  }

  function atualizarBotaoSom() {
    btnSom.textContent = somLigado ? '🔊' : '🔇';
    btnSom.setAttribute('aria-label', somLigado ? 'Desligar o som' : 'Ligar o som');
  }

  btnSom.addEventListener('click', function () {
    somLigado = !somLigado;
    localStorage.setItem('vb_som', somLigado ? 'sim' : 'nao');
    atualizarBotaoSom();
    if (somLigado) tocar('clique');
  });

  // ---------- Fala (nome do país em voz alta) ----------
  var vozPt = null;

  function escolherVozPt() {
    if (!window.speechSynthesis) return;
    var vozes = speechSynthesis.getVoices();
    vozPt = null;
    for (var i = 0; i < vozes.length; i++) {
      var idioma = (vozes[i].lang || '').toLowerCase().replace('_', '-');
      if (idioma.indexOf('pt-br') === 0) { vozPt = vozes[i]; return; }
      if (!vozPt && idioma.indexOf('pt') === 0) vozPt = vozes[i];
    }
  }

  if (window.speechSynthesis) {
    escolherVozPt();
    speechSynthesis.onvoiceschanged = escolherVozPt;
  }

  function falar(texto) {
    if (!somLigado || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      var fala = new SpeechSynthesisUtterance(texto);
      fala.lang = 'pt-BR';
      if (vozPt) fala.voice = vozPt;
      fala.rate = 0.95;
      speechSynthesis.speak(fala);
    } catch (e) {
      // Sem voz disponível: o jogo continua em silêncio.
    }
  }

  function calarFala() {
    if (window.speechSynthesis) {
      try { speechSynthesis.cancel(); } catch (e) { /* ignora */ }
    }
  }

  var btnMusica = document.getElementById('btn-musica');

  function atualizarBotaoMusica() {
    var tocando = window.Musica && Musica.ligada();
    btnMusica.classList.toggle('mudo', !tocando);
    btnMusica.setAttribute('aria-label', tocando ? 'Desligar a música' : 'Ligar a música');
  }

  btnMusica.addEventListener('click', function () {
    if (window.Musica) Musica.alternar();
    atualizarBotaoMusica();
  });

  // ---------- Telas ----------
  function mostrarTela(tela) {
    telaInicio.hidden = tela !== telaInicio;
    telaJogo.hidden   = tela !== telaJogo;
    telaFim.hidden    = tela !== telaFim;
    window.scrollTo(0, 0);
  }

  function atualizarRecordesInicio() {
    var botoes = document.querySelectorAll('[data-recorde]');
    for (var i = 0; i < botoes.length; i++) {
      var nivel = botoes[i].getAttribute('data-recorde');
      var recorde = lerRecordePontos(nivel);
      botoes[i].textContent = recorde === null ? '' : '🏆 ' + formatarPontos(recorde);
    }
  }

  // ---------- Montagem da rodada ----------
  function montarRodada(nivel) {
    var grupo = porNivel(nivel);
    var sorteados = embaralhar(grupo).slice(0, TOTAL_PERGUNTAS);

    jogo.nivel = nivel;
    jogo.indice = 0;
    jogo.acertos = 0;
    jogo.pontos = 0;
    jogo.combo = 0;
    jogo.resultados = [];
    jogo.perguntas = sorteados.map(function (pais) {
      var outros = embaralhar(grupo.filter(function (p) { return p.codigo !== pais.codigo; })).slice(0, 3);
      return {
        pais: pais,
        opcoes: embaralhar([pais].concat(outros))
      };
    });

    seloNivelEl.textContent = NIVEIS[nivel].emoji + ' ' + NIVEIS[nivel].nome;
    mostrarTela(telaJogo);
    mostrarPergunta();
  }

  function desenharProgresso() {
    var html = '';
    for (var i = 0; i < jogo.perguntas.length; i++) {
      var classe = 'ponto';
      if (i < jogo.resultados.length) {
        classe += jogo.resultados[i] ? ' certo' : ' errado';
      } else if (i === jogo.indice) {
        classe += ' atual';
      }
      html += '<span class="' + classe + '"></span>';
    }
    progressoEl.innerHTML = html;
  }

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

  function mostrarPergunta() {
    var pergunta = jogo.perguntas[jogo.indice];
    jogo.respondido = false;

    imgBandeira.alt = 'Bandeira misteriosa, pergunta ' + (jogo.indice + 1) + ' de ' + jogo.perguntas.length;
    imgBandeira.src = 'bandeiras/' + pergunta.pais.codigo + '.png';
    carimbo.hidden = true;
    carimbo.className = 'carimbo';
    avisoEl.innerHTML = '&nbsp;';

    contadorEl.textContent = 'Bandeira ' + (jogo.indice + 1) + ' de ' + jogo.perguntas.length;
    placarEl.textContent = '⭐ ' + formatarPontos(jogo.pontos);
    desenharProgresso();
    atualizarCombo();
    iniciarBarraBonus();

    respostasEl.innerHTML = '';
    var letras = ['A', 'B', 'C', 'D'];
    pergunta.opcoes.forEach(function (opcao, posicao) {
      var botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'btn-resposta';
      botao.setAttribute('data-codigo', opcao.codigo);

      var letra = document.createElement('span');
      letra.className = 'letra-resposta letra-' + letras[posicao].toLowerCase();
      letra.textContent = letras[posicao];

      var texto = document.createElement('span');
      texto.className = 'texto-resposta';
      texto.textContent = opcao.nome;

      botao.appendChild(letra);
      botao.appendChild(texto);
      botao.addEventListener('click', function () { responder(botao, opcao, pergunta); });

      // Lê o nome do país em voz alta ao passar o mouse ou focar
      // pelo teclado (segue o botão 🔊 de efeitos de som).
      function anunciar() {
        if (!jogo.respondido && !botao.disabled) falar(opcao.nome);
      }
      botao.addEventListener('mouseenter', anunciar);
      botao.addEventListener('focus', anunciar);

      respostasEl.appendChild(botao);
    });

    // Deixa a próxima bandeira pronta para aparecer sem demora.
    if (jogo.indice + 1 < jogo.perguntas.length) {
      var proxima = new Image();
      proxima.src = 'bandeiras/' + jogo.perguntas[jogo.indice + 1].pais.codigo + '.png';
    }
  }

  function carimbar(texto, classe) {
    carimbo.innerHTML = '<span>' + texto + '</span>';
    carimbo.className = 'carimbo animar ' + classe;
    carimbo.hidden = false;
  }

  function responder(botaoClicado, opcao, pergunta) {
    if (jogo.respondido) return;
    jogo.respondido = true;
    calarFala();

    var tempoRestante = DURACAO_BONUS - (performance.now() - jogo.inicioPergunta) / 1000;
    congelarBarraBonus(tempoRestante);

    var acertou = opcao.codigo === pergunta.pais.codigo;
    var botoes = respostasEl.querySelectorAll('.btn-resposta');

    for (var i = 0; i < botoes.length; i++) {
      botoes[i].disabled = true;
      if (botoes[i].getAttribute('data-codigo') === pergunta.pais.codigo) {
        botoes[i].classList.add('correta');
        var feedbackCerto = document.createElement('small');
        feedbackCerto.className = 'feedback-resposta';
        feedbackCerto.textContent = '✓ Resposta certa';
        botoes[i].querySelector('.texto-resposta').appendChild(feedbackCerto);
      } else if (botoes[i] !== botaoClicado) {
        botoes[i].classList.add('apagada');
      }
    }

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
      botaoClicado.classList.add('errada');
      jogo.combo = 0;
      atualizarCombo();
      var feedbackErro = document.createElement('small');
      feedbackErro.className = 'feedback-resposta';
      feedbackErro.textContent = '✕ Sua escolha';
      botaoClicado.querySelector('.texto-resposta').appendChild(feedbackErro);
      carimbar('OPA!', 'errado');
      avisoEl.textContent = 'Era ' + pergunta.pais.nome + '. Você aprendeu uma nova!';
      tocar('erro');
    }

    jogo.resultados.push(acertou);
    placarEl.textContent = '⭐ ' + formatarPontos(jogo.pontos);
    desenharProgresso();

    setTimeout(function () {
      jogo.indice++;
      if (jogo.indice < jogo.perguntas.length) {
        mostrarPergunta();
      } else {
        terminar();
      }
    }, acertou ? 1400 : 2200);
  }

  function elogio() {
    var frases = ['Muito bem!', 'Mandou bem!', 'Você é craque!', 'Isso aí!', 'Que demais!', 'Uau, acertou!'];
    return frases[Math.floor(Math.random() * frases.length)];
  }

  // ---------- Fim de jogo ----------
  function terminar() {
    var total = jogo.perguntas.length;
    var acertos = jogo.acertos;

    var estrelas = acertos >= 9 ? 3 : acertos >= 6 ? 2 : acertos >= 3 ? 1 : 0;
    for (var i = 0; i < estrelasEl.length; i++) {
      estrelasEl[i].className = i < estrelas ? 'estrela cheia' : 'estrela';
    }

    if (acertos === total) {
      medalhaEl.textContent = '🏆';
      tituloFimEl.textContent = 'PERFEITO! Você é um campeão!';
    } else if (acertos >= 7) {
      medalhaEl.textContent = '🥇';
      tituloFimEl.textContent = 'Incrível, grande explorador!';
    } else if (acertos >= 5) {
      medalhaEl.textContent = '🥈';
      tituloFimEl.textContent = 'Muito bem, viajante!';
    } else if (acertos >= 3) {
      medalhaEl.textContent = '🥉';
      tituloFimEl.textContent = 'Boa! Continue explorando!';
    } else {
      medalhaEl.textContent = '🌱';
      tituloFimEl.textContent = 'Não desista! Tente de novo!';
    }

    placarFinalEl.textContent = 'Você fez ' + formatarPontos(jogo.pontos) + ' pontos e acertou ' + acertos + ' de ' + total + ' bandeiras no nível ' + NIVEIS[jogo.nivel].nome + '.';

    var recordeAntigo = lerRecordePontos(jogo.nivel);
    var bateuRecorde = recordeAntigo === null ? jogo.pontos > 0 : jogo.pontos > recordeAntigo;
    if (bateuRecorde) {
      localStorage.setItem(chaveRecordePontos(jogo.nivel), String(jogo.pontos));
    }
    novoRecordeEl.hidden = !bateuRecorde;

    mostrarTela(telaFim);
    tocar(acertos >= 5 ? 'fanfarra' : 'erro');
    if (acertos >= 7 || bateuRecorde) soltarConfete();
  }

  function soltarConfete() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var cores = ['#ffc93c', '#3ec96e', '#ff6b6b', '#9b6bf2', '#4db5f5', '#ff9f45'];
    for (var i = 0; i < 70; i++) {
      var pedaco = document.createElement('div');
      pedaco.className = 'confete';
      pedaco.style.left = Math.random() * 100 + 'vw';
      pedaco.style.background = cores[Math.floor(Math.random() * cores.length)];
      pedaco.style.animationDuration = (2 + Math.random() * 2.5) + 's';
      pedaco.style.animationDelay = (Math.random() * 0.8) + 's';
      pedaco.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      pedaco.style.width = pedaco.style.height = (8 + Math.random() * 8) + 'px';
      document.body.appendChild(pedaco);
      setTimeout(function (el) { return function () { el.remove(); }; }(pedaco), 6000);
    }
  }

  imgBandeira.addEventListener('error', function () {
    avisoEl.textContent = 'Não foi possível mostrar esta bandeira. Você pode continuar escolhendo uma resposta.';
    imgBandeira.alt = 'Bandeira indisponível';
  });

  // ---------- Ligações ----------
  var botoesNivel = document.querySelectorAll('.btn-nivel');
  for (var i = 0; i < botoesNivel.length; i++) {
    (function (botao) {
      botao.addEventListener('click', function () {
        tocar('clique');
        montarRodada(botao.getAttribute('data-nivel'));
      });
    })(botoesNivel[i]);
  }

  document.getElementById('btn-inicio').addEventListener('click', function () {
    tocar('clique');
    atualizarRecordesInicio();
    mostrarTela(telaInicio);
  });

  document.getElementById('btn-de-novo').addEventListener('click', function () {
    tocar('clique');
    montarRodada(jogo.nivel);
  });

  document.getElementById('btn-mudar').addEventListener('click', function () {
    tocar('clique');
    atualizarRecordesInicio();
    mostrarTela(telaInicio);
  });

  // Teclas 1 a 4 respondem, para quem já sabe ler o teclado.
  document.addEventListener('keydown', function (evento) {
    if (telaJogo.hidden || jogo.respondido) return;
    var numero = parseInt(evento.key, 10);
    if (numero >= 1 && numero <= 4) {
      var botoes = respostasEl.querySelectorAll('.btn-resposta');
      if (botoes[numero - 1]) botoes[numero - 1].click();
    }
  });

  // ---------- Início ----------
  atualizarBotaoSom();
  atualizarBotaoMusica();
  atualizarRecordesInicio();

  // Atalho: abrir index.html?nivel=facil (ou medio, dificil, impossivel)
  // começa o jogo direto nesse nível.
  var nivelUrl = new URLSearchParams(window.location.search).get('nivel');
  if (nivelUrl && NIVEIS[nivelUrl]) {
    montarRodada(nivelUrl);
  } else {
    mostrarTela(telaInicio);
  }
})();


