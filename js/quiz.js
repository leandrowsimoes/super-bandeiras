/* ============================================================
   Super Bandeiras! — Motor do quiz
   Usado pelo Quiz Livre e pelas fases do Mapa de Aventura.
   Modos: "pais" (vê a bandeira, escolhe o nome) e "bandeira"
   (ouve/lê o nome, escolhe a bandeira). No Pequeno Explorador:
   3 opções, leitura automática, sem bônus e segunda chance.
   ============================================================ */

(function () {
  'use strict';

  var DURACAO_BONUS = 8;   // segundos da janela de bônus por pergunta
  var PONTO_BASE    = 100; // pontos-base por acerto
  var BONUS_MAX     = 100; // bônus máximo por responder rápido
  var COMBO_MAX     = 5;   // teto do multiplicador de acertos seguidos
  var PONTOS_SEGUNDA_CHANCE = 50;
  var MAX_LUPAS     = 3;

  var ELOGIOS = ['Muito bem!', 'Mandou bem!', 'Você é craque!', 'Isso aí!', 'Que demais!', 'Uau, acertou!'];
  var CONSOLOS = ['Quase! Agora você já sabe.', 'Tudo bem, errar ajuda a aprender!', 'Essa era difícil!'];

  // ---------- Elementos ----------
  function $(id) { return document.getElementById(id); }
  var imgBandeira   = $('img-bandeira');
  var mastro        = $('mastro');
  var nomeAlvoEl    = $('nome-alvo');
  var carimbo       = $('carimbo');
  var dicaEl        = $('dica-continente');
  var respostasEl   = $('respostas');
  var progressoEl   = $('progresso');
  var contadorEl    = $('contador');
  var placarEl      = $('placar');
  var seloNivelEl   = $('selo-nivel');
  var perguntaEl    = $('pergunta');
  var avisoEl       = $('aviso');
  var mascoteEl     = $('mascote-jogo');
  var barraBonus    = $('barra-bonus');
  var barraBonusFill = $('barra-bonus-fill');
  var seloComboEl   = $('selo-combo');
  var quadroBandeira = $('quadro-bandeira');
  var cartaJogo     = $('carta-jogo');
  var btnLupa       = $('btn-lupa');
  var btnDica       = $('btn-dica');
  var curiosidadeEl = $('curiosidade');
  var btnProxima    = $('btn-proxima');

  // ---------- Estado ----------
  var config = null;
  var jogo = null;

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

  function sortear(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  }

  function formatarPontos(n) {
    return n.toLocaleString('pt-BR');
  }

  function calcularPontos(tempoRestante, combo) {
    var bonus = jogo.pequeno ? 0 : Math.round(BONUS_MAX * Math.max(0, tempoRestante / DURACAO_BONUS));
    return Math.round((PONTO_BASE + bonus) * Math.min(combo, COMBO_MAX));
  }

  function info(pais) {
    return INFO_PAISES[pais.codigo];
  }

  function textoCuriosidade(pais) {
    var dados = info(pais);
    return dados.curiosidade || ('A capital é ' + dados.capital + '.');
  }

  // ---------- Mascote ----------
  function mascote(estado, fala) {
    mascoteEl.classList.remove('feliz', 'triste', 'pensando');
    void mascoteEl.offsetWidth; // reinicia a animação do estado
    if (estado) mascoteEl.classList.add(estado);
    avisoEl.textContent = fala;
  }

  // ---------- Barra de bônus ----------
  function iniciarBarraBonus() {
    jogo.inicioPergunta = performance.now();
    barraBonus.hidden = jogo.pequeno;
    if (jogo.pequeno) return;
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

  // ---------- Placar, progresso e combo ----------
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

  function atualizarPlacar() {
    placarEl.textContent = '⭐ ' + formatarPontos(jogo.pontos);
  }

  function atualizarCombo(subiu) {
    if (jogo.combo < 2) {
      seloComboEl.hidden = true;
      return;
    }
    seloComboEl.textContent = (jogo.combo >= COMBO_MAX ? '🔥🔥 x' : '🔥 x') + Math.min(jogo.combo, COMBO_MAX);
    seloComboEl.hidden = false;
    seloComboEl.classList.toggle('quente', jogo.combo >= 3);
    seloComboEl.classList.toggle('super', jogo.combo >= COMBO_MAX);
    if (subiu) Efeitos.reanimar(seloComboEl, 'pulsar');
  }

  function mostrarPontosFlutuantes(valor) {
    if (Efeitos.movimentoReduzido()) return;
    var bolha = document.createElement('div');
    bolha.className = 'pontos-flutuantes';
    bolha.textContent = '+' + formatarPontos(valor);
    quadroBandeira.appendChild(bolha);
    setTimeout(function () { bolha.remove(); }, 1200);
  }

  function mostrarSuper() {
    Sons.tocar('super');
    Efeitos.reanimar(cartaJogo, 'tremer');
    if (Efeitos.movimentoReduzido()) return;
    var faixa = document.createElement('div');
    faixa.className = 'super-texto';
    faixa.textContent = 'SUPER!';
    quadroBandeira.appendChild(faixa);
    setTimeout(function () { faixa.remove(); }, 1300);
  }

  // ---------- Ajudas ----------
  function atualizarAjudas() {
    btnLupa.querySelector('b').textContent = jogo.lupas;
    btnDica.querySelector('b').textContent = jogo.dicas;
    btnLupa.disabled = jogo.respondido || jogo.lupas === 0 || jogo.lupaUsada;
    btnDica.disabled = jogo.respondido || jogo.dicas === 0 || jogo.dicaUsada;
  }

  function usarLupa() {
    if (btnLupa.disabled) return;
    jogo.lupas--;
    jogo.lupaUsada = true;
    Sons.tocar('boing');
    var pergunta = jogo.perguntas[jogo.indice];
    var erradas = embaralhar(Array.prototype.filter.call(respostasEl.querySelectorAll('.btn-resposta:not(:disabled)'), function (b) {
      return b.getAttribute('data-codigo') !== pergunta.pais.codigo;
    }));
    // Deixa só duas opções: a certa e uma errada.
    erradas.slice(0, erradas.length - 1).forEach(function (botao) {
      botao.disabled = true;
      botao.classList.add('sumindo');
    });
    atualizarAjudas();
  }

  function usarDica() {
    if (btnDica.disabled) return;
    jogo.dicas--;
    jogo.dicaUsada = true;
    Sons.tocar('boing');
    var continente = CONTINENTES.filter(function (c) { return c.id === info(jogo.perguntas[jogo.indice].pais).continente; })[0];
    dicaEl.textContent = continente.emoji + ' Fica ' + continente.onde + '!';
    dicaEl.hidden = false;
    Efeitos.reanimar(dicaEl, 'entrar-dica');
    Voz.falar('Dica: fica ' + continente.onde + '.');
    atualizarAjudas();
  }

  btnLupa.addEventListener('click', usarLupa);
  btnDica.addEventListener('click', usarDica);

  // ---------- Montagem ----------
  // opcoes: { perguntas: [pais], grupo: [pais], modo: 'pais'|'bandeira',
  //           titulo, icone (id opcional), aoTerminar(resultado), aoSair() }
  function iniciar(opcoes) {
    config = opcoes;
    var pequeno = Progresso.pequeno();
    var quantasOpcoes = pequeno ? 3 : 4;
    jogo = {
      modo: opcoes.modo || 'pais',
      pequeno: pequeno,
      indice: 0,
      acertos: 0,
      pontos: 0,
      combo: 0,
      melhorCombo: 0,
      resultados: [],
      novosCarimbos: [],
      respondido: false,
      tentativas: 0,
      lupas: 1,
      dicas: 1,
      inicioPergunta: 0,
      perguntas: opcoes.perguntas.map(function (pais) {
        var outros = embaralhar(opcoes.grupo.filter(function (p) { return p.codigo !== pais.codigo; })).slice(0, quantasOpcoes - 1);
        return { pais: pais, opcoes: embaralhar([pais].concat(outros)) };
      })
    };
    seloNivelEl.innerHTML = opcoes.icone ? Icone.html(opcoes.icone) + ' ' : '';
    seloNivelEl.appendChild(document.createTextNode(opcoes.titulo));
    cartaJogo.classList.toggle('modo-bandeira', jogo.modo === 'bandeira');
    atualizarPlacar();
    Telas.mostrar('tela-jogo', { aoTrocar: mostrarPergunta, instantaneo: opcoes.instantaneo });
  }

  function criarBotaoResposta(opcao, posicao, pergunta) {
    var botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'btn-resposta entrar-cascata';
    botao.style.animationDelay = (120 + posicao * 70) + 'ms';
    botao.setAttribute('data-codigo', opcao.codigo);

    var letra = document.createElement('span');
    letra.className = 'letra-resposta';
    letra.textContent = String(posicao + 1);
    botao.appendChild(letra);

    if (jogo.modo === 'bandeira') {
      var img = document.createElement('img');
      img.className = 'bandeira-opcao';
      img.src = 'bandeiras/' + opcao.codigo + '.png';
      img.alt = 'Bandeira opção ' + (posicao + 1);
      botao.appendChild(img);
    } else {
      var texto = document.createElement('span');
      texto.className = 'texto-resposta';
      texto.textContent = opcao.nome;
      botao.appendChild(texto);
      // Lê o nome ao passar o mouse ou focar pelo teclado. No modo
      // bandeira não lê, senão entregaria a resposta.
      var anunciar = function () {
        if (!jogo.respondido && !botao.disabled) Voz.falar(opcao.nome);
      };
      botao.addEventListener('mouseenter', anunciar);
      botao.addEventListener('focus', anunciar);
    }
    botao.addEventListener('click', function () { responder(botao, opcao, pergunta); });
    return botao;
  }

  function mostrarPergunta() {
    var pergunta = jogo.perguntas[jogo.indice];
    var total = jogo.perguntas.length;
    jogo.respondido = false;
    jogo.tentativas = 0;
    jogo.lupaUsada = false;
    jogo.dicaUsada = false;

    carimbo.hidden = true;
    dicaEl.hidden = true;
    curiosidadeEl.hidden = true;
    contadorEl.textContent = 'Bandeira ' + (jogo.indice + 1) + ' de ' + total;
    mascote('pensando', jogo.pequeno ? 'Escute e escolha!' : 'Qual será?');

    if (jogo.modo === 'bandeira') {
      mastro.hidden = true;
      nomeAlvoEl.hidden = false;
      nomeAlvoEl.textContent = pergunta.pais.nome;
      Efeitos.reanimar(nomeAlvoEl, 'entrar-nome');
      perguntaEl.textContent = 'Ache a bandeira:';
    } else {
      mastro.hidden = false;
      nomeAlvoEl.hidden = true;
      imgBandeira.alt = 'Bandeira misteriosa, pergunta ' + (jogo.indice + 1) + ' de ' + total;
      imgBandeira.src = 'bandeiras/' + pergunta.pais.codigo + '.png';
      Efeitos.reanimar(mastro, 'entrar');
      perguntaEl.textContent = 'De qual país é esta bandeira?';
    }
    Sons.tocar('virar');

    desenharProgresso();
    atualizarCombo(false);
    atualizarAjudas();
    iniciarBarraBonus();

    respostasEl.innerHTML = '';
    pergunta.opcoes.forEach(function (opcao, posicao) {
      respostasEl.appendChild(criarBotaoResposta(opcao, posicao, pergunta));
    });

    lerPergunta(pergunta);

    // Deixa a próxima bandeira pronta para aparecer sem demora.
    var proxima = jogo.perguntas[jogo.indice + 1];
    if (proxima) {
      (jogo.modo === 'bandeira' ? proxima.opcoes : [proxima.pais]).forEach(function (p) {
        new Image().src = 'bandeiras/' + p.codigo + '.png';
      });
    }
  }

  function lerPergunta(pergunta) {
    if (jogo.modo === 'bandeira') {
      Voz.falar('Ache a bandeira: ' + pergunta.pais.nome);
      return;
    }
    if (!jogo.pequeno) return;
    // Pequeno Explorador: lê a pergunta e cada opção, destacando-a.
    var botoes = respostasEl.querySelectorAll('.btn-resposta');
    var trechos = [perguntaEl.textContent].concat(pergunta.opcoes.map(function (o) { return o.nome; }));
    Voz.falarSequencia(trechos, function (i) {
      for (var b = 0; b < botoes.length; b++) botoes[b].classList.toggle('lendo', b === i - 1);
    }, function () {
      for (var b = 0; b < botoes.length; b++) botoes[b].classList.remove('lendo');
    });
  }

  function carimbar(texto, classe) {
    carimbo.innerHTML = '<span>' + texto + '</span>';
    carimbo.className = 'carimbo animar ' + classe;
    carimbo.hidden = false;
  }

  function marcarCorreta(codigoCerto) {
    var botoes = respostasEl.querySelectorAll('.btn-resposta');
    for (var i = 0; i < botoes.length; i++) {
      botoes[i].disabled = true;
      botoes[i].classList.remove('lendo');
      if (botoes[i].getAttribute('data-codigo') === codigoCerto) {
        botoes[i].classList.add('correta');
      } else if (!botoes[i].classList.contains('errada')) {
        botoes[i].classList.add('apagada');
      }
    }
  }

  function acrescentarFeedback(botao, texto) {
    var feedback = document.createElement('small');
    feedback.className = 'feedback-resposta';
    feedback.textContent = texto;
    botao.appendChild(feedback);
  }

  function registrarCarimbo(pais) {
    if (Progresso.carimbar(pais.codigo)) jogo.novosCarimbos.push(pais.codigo);
  }

  function responder(botaoClicado, opcao, pergunta) {
    if (jogo.respondido || botaoClicado.disabled) return;
    Voz.calar();

    var tempoRestante = DURACAO_BONUS - (performance.now() - jogo.inicioPergunta) / 1000;
    var acertou = opcao.codigo === pergunta.pais.codigo;

    // Pequeno Explorador: o primeiro erro vira "tente de novo".
    if (!acertou && jogo.pequeno && jogo.tentativas === 0) {
      jogo.tentativas = 1;
      jogo.combo = 0;
      atualizarCombo(false);
      botaoClicado.disabled = true;
      botaoClicado.classList.add('errada', 'tremer');
      Sons.tocar('erro');
      mascote('triste', 'Tente de novo!');
      Voz.falar('Tente de novo!');
      return;
    }

    jogo.respondido = true;
    congelarBarraBonus(tempoRestante);
    marcarCorreta(pergunta.pais.codigo);

    if (acertou) {
      jogo.acertos++;
      var ganho;
      if (jogo.tentativas === 0) {
        jogo.combo++;
        jogo.melhorCombo = Math.max(jogo.melhorCombo, jogo.combo);
        ganho = calcularPontos(tempoRestante, jogo.combo);
      } else {
        ganho = PONTOS_SEGUNDA_CHANCE;
      }
      jogo.pontos += ganho;
      registrarCarimbo(pergunta.pais);
      acrescentarFeedback(botaoClicado, '✓ Certo!');
      Efeitos.reanimar(botaoClicado, 'pular');
      Efeitos.explodirDe(botaoClicado);
      mostrarPontosFlutuantes(ganho);
      carimbar('ACERTOU!', 'certo');
      mascote('feliz', sortear(ELOGIOS));
      Sons.tocar('acerto');
      atualizarCombo(true);
      if (jogo.combo >= 2) Sons.tocar('combo', jogo.combo);
      if (jogo.combo === COMBO_MAX) mostrarSuper();
      if (jogo.combo > 0 && jogo.combo % 3 === 0 && jogo.lupas < MAX_LUPAS) {
        jogo.lupas++;
        Efeitos.faixa('lupa', 'Ganhou uma Lupa!', 'Ela tira respostas erradas.');
      }
      Progresso.desbloquear('primeiro-acerto');
      if (jogo.combo >= COMBO_MAX) Progresso.desbloquear('combo-5');
    } else {
      jogo.combo = 0;
      atualizarCombo(false);
      botaoClicado.classList.add('errada');
      Efeitos.reanimar(botaoClicado, 'tremer');
      acrescentarFeedback(botaoClicado, '✕ Sua escolha');
      var correta = respostasEl.querySelector('.btn-resposta.correta');
      if (correta) acrescentarFeedback(correta, '✓ Resposta certa');
      carimbar('OPA!', 'errado');
      mascote('triste', sortear(CONSOLOS));
      Sons.tocar('erro');
    }

    jogo.resultados.push(acertou);
    atualizarPlacar();
    desenharProgresso();
    atualizarAjudas();
    mostrarCuriosidade(pergunta.pais, acertou);
  }

  function mostrarCuriosidade(pais, acertou) {
    var dados = info(pais);
    $('curiosidade-bandeira').src = 'bandeiras/' + pais.codigo + '.png';
    $('curiosidade-bandeira').alt = 'Bandeira de ' + pais.nome;
    $('curiosidade-nome').textContent = pais.nome;
    $('curiosidade-capital').textContent = 'Capital: ' + dados.capital;
    $('curiosidade-texto').textContent = textoCuriosidade(pais);
    btnProxima.textContent = jogo.indice + 1 < jogo.perguntas.length ? 'Próxima ➜' : 'Ver resultado 🏁';
    curiosidadeEl.hidden = false;
    Efeitos.reanimar(curiosidadeEl, 'subir');
    btnProxima.focus({ preventScroll: true });
    curiosidadeEl.scrollIntoView({ block: 'nearest', behavior: Efeitos.movimentoReduzido() ? 'auto' : 'smooth' });
    Voz.falar((acertou ? pais.nome + '! ' : 'Era ' + pais.nome + '. ') + textoCuriosidade(pais));
  }

  function avancar() {
    if (!jogo || !jogo.respondido) return;
    Voz.calar();
    Sons.tocar('clique');
    jogo.indice++;
    if (jogo.indice < jogo.perguntas.length) {
      mostrarPergunta();
    } else {
      terminar();
    }
  }

  btnProxima.addEventListener('click', avancar);

  function terminar() {
    var total = jogo.perguntas.length;
    if (jogo.acertos === total && total >= 5) Progresso.desbloquear('perfeito');
    var resultado = {
      acertos: jogo.acertos,
      total: total,
      pontos: jogo.pontos,
      melhorCombo: jogo.melhorCombo,
      novosCarimbos: jogo.novosCarimbos
    };
    jogo = null;
    config.aoTerminar(resultado);
  }

  $('btn-inicio').addEventListener('click', function () {
    Voz.calar();
    Sons.tocar('clique');
    jogo = null;
    config.aoSair();
  });

  // Teclas 1 a 4 respondem; Enter/Espaço avançam depois da resposta.
  document.addEventListener('keydown', function (evento) {
    if (Telas.atual() !== 'tela-jogo' || !jogo) return;
    if (!jogo.respondido) {
      var numero = parseInt(evento.key, 10);
      var botoes = respostasEl.querySelectorAll('.btn-resposta');
      if (numero >= 1 && botoes[numero - 1]) botoes[numero - 1].click();
      return;
    }
    // Se o foco já está num botão, o próprio navegador aciona o clique.
    var focoEmBotao = document.activeElement && document.activeElement.tagName === 'BUTTON';
    if ((evento.key === 'Enter' || evento.key === ' ') && !focoEmBotao) {
      evento.preventDefault();
      avancar();
    }
  });

  imgBandeira.addEventListener('error', function () {
    avisoEl.textContent = 'Não foi possível mostrar esta bandeira. Você pode continuar escolhendo uma resposta.';
    imgBandeira.alt = 'Bandeira indisponível';
  });

  window.Quiz = {
    iniciar: iniciar,
    embaralhar: embaralhar
  };
})();
